export function getWeekDates(offset: number): { start: string; end: string } {
  const baseDate = new Date(2025, 0, 6); // Lunedì 6 gennaio 2025
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + offset * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    start: monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    end: friday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
  };
}
