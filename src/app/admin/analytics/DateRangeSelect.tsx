"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DatePickerWithRange, type DateRangeValue } from "@/components/ui/date-range-picker";

type Props = {
  value: DateRangeValue;
  resellerId?: string;
};

export function DateRangeSelect({ value, resellerId }: Props) {
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
      params.set("period", "30");
    }
    if (resellerId) {
      params.set("reseller", resellerId);
    } else {
      params.delete("reseller");
    }
    router.push(`/admin/analytics?${params.toString()}`);
  };

  return <DatePickerWithRange value={value} onChange={handleChange} />;
}
