#!/bin/bash
# Generate placeholder SVG images for Monarca Semijoyas

create_svg() {
  local file="$1" w="$2" h="$3" label="$4" bg="${5:-#f0ece8}"
  cat > "$file" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="$w" height="$h" viewBox="0 0 $w $h">
  <rect width="$w" height="$h" fill="$bg"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".35em" font-family="Inter,sans-serif" font-size="14" fill="#b4aba2">$label</text>
</svg>
EOF
}

# Hero banner
create_svg "hero-banner.jpg" 1440 630 "Hero Banner" "#2a2014"
# Reseller BG
create_svg "reseller-bg.jpg" 1440 700 "Reseller CTA" "#1a1510"
# Historia BG
create_svg "historia-bg.jpg" 1440 900 "Nuestra Historia" "#1f1a14"

# Products
for i in $(seq 1 10); do
  create_svg "products/product-$i.jpg" 260 340 "Producto $i" "#f0ece8"
done

# Categories
create_svg "categories/aros-pequenos.jpg" 546 383 "Aros Pequeños" "#d4c8b8"
create_svg "categories/aros-medianos.jpg" 546 383 "Aros Medianos" "#c8bca8"
create_svg "categories/aros-grandes.jpg" 546 383 "Aros Grandes" "#bab0a0"

echo "Placeholders generated!"
