// Aramada "kesinlesme", "Kesinleşme" ve "KESİNLEŞME" aynı sonucu verir.
// Tarayıcı betiği de kullandığı için bağımlılıksız tutulur.
export const normalize = (value: string) =>
  value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
