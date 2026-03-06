import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { secret } = await req.json();

        if (!secret) {
            return NextResponse.json({ message: 'Code ist erforderlich' }, { status: 400 });
        }

        // Search for user with this setup secret
        const { data: user, error } = await supabase
            .from('users')
            .select('email, role, name')
            .eq('setup_secret', secret)
            .single();

        if (error || !user) {
            return NextResponse.json({ message: 'Ungültiger oder abgelaufener Code' }, { status: 401 });
        }

        // Return email and a message
        return NextResponse.json({
            email: user.email,
            tempPass: 'Ihre initialen Zugangsdaten', // Security: Don't return plain password, but guide the user
            name: user.name,
            role: user.role
        });
    } catch (error: any) {
        console.error('Verify Setup Error:', error);
        return NextResponse.json({ message: 'Ein interner Fehler ist aufgetreten' }, { status: 500 });
    }
}
