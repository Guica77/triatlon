'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createMarketplaceListing(data: {
  title: string;
  price: number;
  original_price?: number;
  category: string;
  condition: string;
  images: string[];
  location: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get user profile for seller name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const seller_name = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Atleta de Triatlón Pro';

  const { error } = await supabase
    .from('marketplace_items')
    .insert({
      title: data.title,
      price: data.price,
      original_price: data.original_price || null,
      category: data.category,
      condition: data.condition,
      source_portal: 'Triatlon Pro',
      external_url: '#', // Internal P2P uses chat instead of external link
      external_images: data.images.length > 0 ? data.images : ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop'],
      location: data.location,
      seller_id: user.id, // Mandatory for RLS owner policies
      seller_name: seller_name,
      is_active: true
    });

  if (error) {
    console.error('Error creating listing:', error);
    return { error: 'Error al publicar el anuncio. Por favor, inténtalo de nuevo.' };
  }

  revalidatePath('/marketplace');
  return { success: true };
}
