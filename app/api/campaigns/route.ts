import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Sort by label then campaign name for better readability
        const campaigns = await prisma.campaign.findMany({
            orderBy: [
                { rowOrder: 'asc' },
            ]
        });
        return NextResponse.json(campaigns);
    } catch (error) {
        console.error("GET /api/campaigns Error:", error);
        return NextResponse.json({ error: 'Failed to fetch campaigns', details: String(error) }, { status: 500 });
    }
}

// Allow updating a single campaign (manual edit)
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        const updated = await prisma.campaign.update({
            where: { id },
            data: data
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }
}
// Create new campaign
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Remove ID if it's a temporary one or ensure uniqueness
        const { id, ...data } = body;

        // Prisma will auto-generate CUID if we don't provide ID, 
        // or we can use the one from client if we trust it ensures uniqueness.
        // For safety, let's allow Prisma to generate ID if it looks temporary (starts with 'new_')
        const payload = id.startsWith('new_') ? data : { id, ...data };

        const newCampaign = await prisma.campaign.create({
            data: payload
        });
        return NextResponse.json(newCampaign);
    } catch (error) {
        console.error("POST /api/campaigns Error:", error);
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        if (searchParams.get('all') === 'true') {
            await prisma.campaign.deleteMany({});
            return NextResponse.json({ success: true, message: 'All campaigns deleted' });
        }

        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await prisma.campaign.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/campaigns Error:", error);
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }
}
