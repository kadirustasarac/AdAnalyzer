import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function GET() {
    try {
        const campaigns = await prisma.campaign.findMany({
            orderBy: [
                { rowOrder: 'asc' }, // Preserve upload order
            ]
        });

        console.log("Exporting campaigns. First 3:", campaigns.slice(0, 3).map(c => `${c.campaignName} (${c.rowOrder})`));

        // Format data for Excel
        const data = campaigns.map(c => ({
            'Campaign Name': c.campaignName,
            'Labels on Campaign': c.labelsOnCampaign,
            'Camp. Budget': c.campBudget,
            'Camp. Cost (MTD)': c.campCost,
            'Camp. 3D Cost': c.camp3dCost,
            'Camp. Conv': c.campConv,
            'Camp. CPA': c.campCpa,
            'Camp. tCPA': c.campTcpa,
            'MTD Cluster Spend (%)': c.mtdClusterSpendPercent,
            'Label Budget': c.labelBudget,
            'Label Cost (MTD)': c.labelCost,
            'Label 3D Cost': c.label3dCost,
            'Label Conv': c.labelConv,
            'Label Remaining Budget (Daily)': c.labelRemainingBudget,
            'Label KPI Value': c.labelKpiValue,
            'Label CPA': c.labelCpa,
            // The 2 new columns explicitly requested
            'New Daily Budget': c.newDailyBudget || 0,
            'New Target CPA': c.newTargetCpa || 0,
        }));

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Optimized Data');

        const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="Optimized_Campaigns.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        })

    } catch (error) {
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
