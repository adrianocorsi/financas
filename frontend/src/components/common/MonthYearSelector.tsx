import { MONTH_NAMES } from "../../utils/format";

interface Props {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthYearSelector({ month, year, onChange }: Props) {
  const years = Array.from({ length: 6 }, (_, i) => year - 3 + i);

  return (
    <>
      <select value={month} onChange={(e) => onChange(Number(e.target.value), year)}>
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <select value={year} onChange={(e) => onChange(month, Number(e.target.value))}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </>
  );
}
