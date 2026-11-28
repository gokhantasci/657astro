export const gunlukAraclar = [
  { id: 'yuzde', baslik: 'Yüzde ve oran hesaplama', aciklama: 'Bir sayının yüzdesini, yüzde artışını ve iki sayı arasındaki oranı bulun.' },
  { id: 'kdv', baslik: 'KDV hesaplama', aciklama: 'KDV dâhil veya hariç tutarı ve vergi tutarını ayrı ayrı hesaplayın.' },
  { id: 'tarih-farki', baslik: 'İki tarih arası gün hesabı', aciklama: 'İki takvim tarihi arasındaki farkı gün ve hafta olarak bulun.' },
  { id: 'vki', baslik: 'Vücut kitle indeksi hesaplama', aciklama: 'Yetişkinler için DSÖ vücut kitle indeksini boy ve kilodan hesaplayın.' },
  { id: 'kelime-sayaci', baslik: 'Kelime ve karakter sayacı', aciklama: 'Metindeki kelimeleri, karakterleri ve tahmini okuma süresini görün.' },
] as const;

export const gunlukAracYolu = (id: string) => `/hesaplamalar/${id}/`;
