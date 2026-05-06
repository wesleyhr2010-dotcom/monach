"use client";

import { useState } from "react";
import CartBadge from "./CartBadge";
import CartDrawer from "./CartDrawer";

interface CartShellProps {
  resellerWhatsapp: string;
  resellerName: string;
  resellerId: string;
}

export default function CartShell({
  resellerWhatsapp,
  resellerName,
  resellerId,
}: CartShellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <CartBadge onClick={() => setIsOpen(true)} />
      <CartDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resellerWhatsapp={resellerWhatsapp}
        resellerName={resellerName}
        resellerId={resellerId}
      />
    </>
  );
}
