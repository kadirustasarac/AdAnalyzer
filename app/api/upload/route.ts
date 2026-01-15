import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

// Helper to safely parse numbers
const parseNumber = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        // Remove currency symbols, commas, etc.
        const cleanStr = val.replace(/[^\d.-]/g, '');
        if (!cleanStr) return 0;
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

// Helper to safely parse integers
const parseIntVal = (val: any) => {
    if (typeof val === 'number') return Math.floor(val);
    if (typeof val === 'string') {
        const cleanStr = val.replace(/[^\d.-]/g, '');
        if (!cleanStr) return 0;
        const num = parseInt(cleanStr, 10);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

export async function POST(req: Request) {
    console.log("Upload request received");
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error("No file found in form data");
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log("File received:", file.name, file.size);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        console.log(`Parsed ${jsonData.length} rows from Excel`);
        if (jsonData.length > 0) {
            console.log("First row headers:", Object.keys(jsonData[0] as object));
        }

        // Process data for bulk insert
        const validCampaigns = jsonData.map((row: any, index: number) => {
            const campaignName = row['Campaign name'];
            const labelsOnCampaign = row['Labels on Campaign'];

            if (!campaignName || !labelsOnCampaign) return null;

            return {
                campaignName: String(campaignName),
                labelsOnCampaign: String(labelsOnCampaign),
                campBudget: parseIntVal(row['Camp. budget']),
                campCost: parseIntVal(row['Camp. cost']),
                camp3dCost: parseIntVal(row['Camp. 3D cost']),
                campConv: parseIntVal(row['Camp. conv.']),
                campCpa: parseNumber(row['Camp. CPA']),
                campTcpa: parseNumber(row['Camp. tCPA']),
                mtdClusterSpendPercent: parseNumber(row['MTD Cluster Spend']) || parseNumber(row['MTD Cluster Spend (%)']),
                labelBudget: parseIntVal(row['Label budget']),
                labelCost: parseIntVal(row['Label cost']),
                label3dCost: parseIntVal(row['Label 3D cost']),
                labelConv: parseIntVal(row['Label conv.']),
                labelRemainingBudget: parseNumber(row['Label remaining budget']),
                labelKpiValue: parseNumber(row['Label KPI value']),
                labelCpa: parseNumber(row['Label CPA']),
                rowOrder: index, // Preserve Excel order
            };
        }).filter((c): c is NonNullable<typeof c> => c !== null);

        console.log(`Preparing to overwrite with ${validCampaigns.length} records`);

        console.log(`Preparing to upsert ${validCampaigns.length} records`);

        // Transaction: Upsert each record
        const operations = validCampaigns.map(campaign => {
            return prisma.campaign.upsert({
                where: {
                    campaignName_labelsOnCampaign: {
                        campaignName: campaign.campaignName,
                        labelsOnCampaign: campaign.labelsOnCampaign
                    }
                },
                update: campaign,
                create: campaign as any
            });
        });

        await prisma.$transaction(operations);

        console.log("Upsert successful");
        return NextResponse.json({ success: true, count: validCampaigns.length });

    } catch (error) {
        console.error('Upload error details:', error);
        return NextResponse.json({ error: 'Failed to process file', details: String(error) }, { status: 500 });
    }
}
