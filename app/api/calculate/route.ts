import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Campaign } from '@prisma/client';

export async function POST() {
    try {
        const campaigns = await prisma.campaign.findMany();

        // 1. Group by Label
        const groupedMap = new Map<string, Campaign[]>();
        campaigns.forEach(c => {
            const label = c.labelsOnCampaign || 'Unlabeled';
            if (!groupedMap.has(label)) {
                groupedMap.set(label, []);
            }
            groupedMap.get(label)?.push(c);
        });

        const updates: any[] = [];

        // 2. Process each Group
        for (const [label, group] of groupedMap.entries()) {
            if (group.length === 0) continue;

            const DAYS_REMAINING = 15;
            const MIN_DAILY_BUDGET = 5;
            const INDIA_BUDGET_RATIO = 0.30;

            // Get Group Level Metrics (Assuming consistent across group or taking first)
            // In the Python script: group['Label budget'].iloc[0]
            const first = group[0];
            const labelBudgetMonthly = first.labelBudget;
            let targetDailySpend = first.labelRemainingBudget;
            const labelKpi = first.labelKpiValue;

            if (targetDailySpend <= 0) {
                targetDailySpend = group.length * MIN_DAILY_BUDGET;
            }

            // Define "Is India"
            const isIndia = (c: Campaign) => c.campaignName.includes('India');

            // India Cap Logic
            const indiaCampaigns = group.filter(isIndia);
            const indiaSpent = indiaCampaigns.reduce((sum, c) => sum + c.campCost, 0);
            const maxIndia = labelBudgetMonthly * INDIA_BUDGET_RATIO;
            const remIndia = maxIndia - indiaSpent;

            let indiaDailyCap = 0;
            if (remIndia > 0) {
                indiaDailyCap = remIndia / DAYS_REMAINING;
            }

            const numIndia = indiaCampaigns.length;
            if (indiaDailyCap < numIndia * MIN_DAILY_BUDGET) {
                indiaDailyCap = numIndia * MIN_DAILY_BUDGET;
            }

            // Calculate Scores & Temp Budget
            // Helper for score
            const getBudgetScore = (c: Campaign) => {
                const momentum = Math.max(c.camp3dCost, MIN_DAILY_BUDGET);
                const cpa = c.campCpa > 0 ? c.campCpa : labelKpi;
                const eff = labelKpi / cpa;

                let factor = 1.0;
                if (eff >= 1.0) factor = 1.25;
                else if (eff < (1.0 / 1.15)) factor = 0.75;
                else factor = 1.0;

                return momentum * factor;
            };

            // We need to store intermediate values, so map to an object extension
            let calcData = group.map(c => ({
                original: c,
                score: getBudgetScore(c),
                tempBudget: 0,
                newDailyBudget: 0,
                rawTcpa: 0,
                newTcpa: 0,
                isIndia: isIndia(c)
            }));

            const totalScore = calcData.reduce((sum, d) => sum + d.score, 0);

            if (totalScore === 0) {
                calcData.forEach(d => d.tempBudget = targetDailySpend / calcData.length);
            } else {
                calcData.forEach(d => d.tempBudget = (d.score / totalScore) * targetDailySpend);
            }

            // Handle India Cap & Redistribution
            const currIndiaSum = calcData.filter(d => d.isIndia).reduce((sum, d) => sum + d.tempBudget, 0);

            if (numIndia > 0 && currIndiaSum > indiaDailyCap) {
                const scale = indiaDailyCap / currIndiaSum;
                calcData.filter(d => d.isIndia).forEach(d => d.tempBudget *= scale);

                const surplus = currIndiaSum - indiaDailyCap;
                const nonIndiaData = calcData.filter(d => !d.isIndia);

                if (nonIndiaData.length > 0) {
                    const niScore = nonIndiaData.reduce((sum, d) => sum + d.score, 0);
                    if (niScore > 0) {
                        nonIndiaData.forEach(d => {
                            d.tempBudget += (d.score / niScore) * surplus;
                        });
                    } else {
                        nonIndiaData.forEach(d => {
                            d.tempBudget += surplus / nonIndiaData.length;
                        });
                    }
                }
            }

            // Finalize New Daily Budget
            calcData.forEach(d => {
                d.newDailyBudget = Math.max(d.tempBudget, MIN_DAILY_BUDGET);
            });

            // tCPA Logic
            calcData.forEach(d => {
                const row = d.original;
                const currentCpa = row.campCpa;
                const oldTcpa = row.campTcpa;
                const targetVal = labelKpi;
                const momentum = row.camp3dCost;

                let raw = 0;
                if (currentCpa <= 0) {
                    raw = targetVal;
                } else if (momentum < MIN_DAILY_BUDGET) {
                    raw = Math.max(oldTcpa * 1.2, targetVal);
                } else if (currentCpa < targetVal) {
                    const idealBid = currentCpa * 1.20;
                    raw = Math.max(idealBid, oldTcpa * 1.05);
                } else {
                    raw = oldTcpa * 0.90;
                }
                d.rawTcpa = raw;
            });

            const totalBudget = calcData.reduce((sum, d) => sum + d.newDailyBudget, 0);
            let weightedAvgTcpa = 0;
            if (totalBudget > 0) {
                weightedAvgTcpa = calcData.reduce((sum, d) => sum + (d.rawTcpa * d.newDailyBudget), 0) / totalBudget;
            } else {
                weightedAvgTcpa = calcData.reduce((sum, d) => sum + d.rawTcpa, 0) / calcData.length;
            }

            const upperLimit = labelKpi * 1.15;
            const lowerLimit = labelKpi * 0.85;
            let correctionFactor = 1.0;

            if (weightedAvgTcpa > upperLimit) {
                correctionFactor = upperLimit / weightedAvgTcpa;
            } else if (weightedAvgTcpa < lowerLimit) {
                correctionFactor = lowerLimit / weightedAvgTcpa;
            }

            calcData.forEach(d => {
                let val = d.rawTcpa * correctionFactor;
                d.newTcpa = Math.max(val, 0.01);
            });

            // Prepare Updates
            calcData.forEach(d => {
                updates.push(prisma.campaign.update({
                    where: { id: d.original.id },
                    data: {
                        newDailyBudget: parseFloat(d.newDailyBudget.toFixed(2)),
                        newTargetCpa: parseFloat(d.newTcpa.toFixed(2))
                    }
                }));
            });
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        return NextResponse.json({ success: true, count: updates.length });
    } catch (error) {
        console.error("Optimization Error:", error);
        return NextResponse.json({ error: 'Optimization failed' }, { status: 500 });
    }
}
