
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperty() {
    const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', '9f1d8e99-70b4-4e71-b993-417c7da565c5')
        .single();

    if (error) {
        console.error('Error fetching property:', error);
        return;
    }

    console.log('Property Data:');
    console.log('id:', property.id);
    console.log('title:', property.title);
    console.log('youtube_video_url:', property.youtube_video_url);
    console.log('video_url:', property.video_url);
    console.log('virtual_tour_url:', property.virtual_tour_url);
    console.log('social_media_url:', property.social_media_url);
    console.log('All keys:', Object.keys(property));
}

checkProperty();
