"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Category } from "../actions-categories";

interface CategorySelectProps {
    allCategories: Category[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

interface CategoryTreeNode extends Category {
    children: CategoryTreeNode[];
}

export function CategorySelect({ allCategories, selected, onChange }: CategorySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Build the tree
    const { tree, flatMap } = useMemo(() => {
        const nodes: CategoryTreeNode[] = [];
        const map = new Map<string, CategoryTreeNode>();

        allCategories.forEach(c => map.set(c.id, { ...c, children: [] }));

        allCategories.forEach(c => {
            if (c.parent_id && map.has(c.parent_id)) {
                map.get(c.parent_id)!.children.push(map.get(c.id)!);
            } else {
                nodes.push(map.get(c.id)!);
            }
        });
        return { tree: nodes, flatMap: map };
    }, [allCategories]);

    function toggle(node: CategoryTreeNode) {
        const currentSelected = new Set(selected);

        if (currentSelected.has(node.name)) {
            // Deselecting: remove node and all its children
            const toRemove = [node];
            while (toRemove.length > 0) {
                const n = toRemove.pop()!;
                currentSelected.delete(n.name);
                toRemove.push(...n.children);
            }
        } else {
            // Selecting: add node and all its ancestors
            let curr: CategoryTreeNode | undefined = node;
            while (curr) {
                currentSelected.add(curr.name);
                curr = curr.parent_id ? flatMap.get(curr.parent_id) : undefined;
            }
        }

        onChange(Array.from(currentSelected));
    }

    function remove(catName: string) {
        const cat = allCategories.find(c => c.name === catName);
        if (!cat) {
            onChange(selected.filter((s) => s !== catName));
            return;
        }

        const node = flatMap.get(cat.id);
        if (!node) return;

        const currentSelected = new Set(selected);
        const toRemove = [node];
        while (toRemove.length > 0) {
            const n = toRemove.pop()!;
            currentSelected.delete(n.name);
            toRemove.push(...n.children);
        }

        onChange(Array.from(currentSelected));
    }

    // Render tree recursively
    function renderTree(nodes: CategoryTreeNode[], depth = 0) {
        return nodes.map((node) => {
            const isSelected = selected.includes(node.name);
            const matchesSearch = search === "" || node.name.toLowerCase().includes(search.toLowerCase());

            // If we have a search term, only show matching nodes or nodes that have matching children
            const childElements = renderTree(node.children, depth + 1);
            const hasVisibleChildren = childElements.some(el => el !== null);

            if (!matchesSearch && !hasVisibleChildren) {
                return null;
            }

            return (
                <div key={node.id}>
                    <button
                        type="button"
                        onClick={() => toggle(node)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: `6px 10px 6px ${depth * 20 + 10}px`,
                            background: isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent",
                            border: "none",
                            borderRadius: "4px",
                            color: "var(--admin-text)",
                            cursor: "pointer",
                            fontSize: "13px",
                            textAlign: "left",
                        }}
                    >
                        {depth > 0 && <span style={{ color: "var(--admin-text-muted)", opacity: 0.5 }}>└</span>}
                        <span
                            style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "3px",
                                border: isSelected ? "none" : "1.5px solid var(--admin-border)",
                                background: isSelected ? "var(--admin-accent)" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: "11px",
                                color: "#fff",
                            }}
                        >
                            {isSelected && "✓"}
                        </span>
                        <span>{node.name}</span>
                    </button>
                    {childElements}
                </div>
            );
        });
    }

    const renderedNodes = renderTree(tree);
    const hasVisibleNodes = renderedNodes.some(el => el !== null);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {/* Selected tags + trigger */}
            <div
                className="admin-input"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    alignItems: "center",
                    cursor: "pointer",
                    minHeight: "38px",
                    padding: "6px 10px",
                }}
            >
                {selected.map((catName) => (
                    <span
                        key={catName}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "var(--admin-accent)",
                            color: "#fff",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "12px",
                            fontWeight: 500,
                        }}
                    >
                        {catName}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                remove(catName);
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.7)",
                                cursor: "pointer",
                                padding: "0",
                                fontSize: "14px",
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}
                {selected.length === 0 && (
                    <span style={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>
                        Seleccionar categorías...
                    </span>
                )}
                {/* Dropdown arrow */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                    style={{
                        marginLeft: "auto",
                        flexShrink: 0,
                        opacity: 0.5,
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: "var(--admin-card)",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "8px",
                        marginTop: "4px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        maxHeight: "300px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Search */}
                    <div style={{ padding: "8px", borderBottom: "1px solid var(--admin-border)" }}>
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="Buscar categoría..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            style={{ fontSize: "13px", padding: "6px 10px" }}
                        />
                    </div>
                    {/* Options list */}
                    <div style={{ overflowY: "auto", padding: "4px" }}>
                        {renderedNodes}
                        {!hasVisibleNodes && (
                            <div style={{ padding: "12px", textAlign: "center", color: "var(--admin-text-muted)", fontSize: "13px" }}>
                                No encontrado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
