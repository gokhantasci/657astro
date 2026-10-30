"""Maaş kaynaklarının UTF-8 / Windows-1254 yanıtlarını veri kaybetmeden çöz."""

def sayfa_metni(ham: bytes) -> str:
    try:
        metin = ham.decode('utf-8-sig')
    except UnicodeDecodeError:
        metin = ham.decode('cp1254')
    # U+FFFD ile daha önce bozulmuş bir metin doğru unvan envanteri sayılamaz.
    if '\ufffd' in metin:
        raise ValueError('Kaynakta bozuk karakter var; ham yanıt yeniden alınmalıdır.')
    return metin
