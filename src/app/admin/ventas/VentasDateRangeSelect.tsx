"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DatePickerWithRange, type DateRangeValue } from "@/components/ui/date-range-picker";

type Props = {
  value: DateRangeValue;
};

export function VentasDateRangeSelect({ value }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (range: DateRangeValue) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (range) {
      const from = range.from.toISOString().slice(0, 10);
      const to = range.to.toISOString().slice(0, 10);
      params.set("from", from);
      params.set("to", to);
      params.delete("period");
    } else {
      params.delete("from");
      params.delete("to");
      params.set("period", "7");
    }
    router.push(`/admin/ventas?${params.toString()}`);
  };

  return <DatePickerWithRange value={value} onChange={handleChange} />;
}
