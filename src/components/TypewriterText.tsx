"use client";

import { useState, useEffect } from "react";

const phrases = [
    "Sé una revendedora autorizada",
    "Hacemos envíos a cualquier rincón del Paraguay",
    "Un año de garantía",
];

export default function TypewriterText() {
    const [displayText, setDisplayText] = useState("");
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const phrase = phrases[phraseIndex];

        // Frase completa — pausa antes de apagar
        if (!isDeleting && displayText === phrase) {
            const t = setTimeout(() => setIsDeleting(true), 1800);
            return () => clearTimeout(t);
        }

        // Apagou tudo — avança para próxima frase
        if (isDeleting && displayText === "") {
            setIsDeleting(false);
            setPhraseIndex(i => (i + 1) % phrases.length);
            return;
        }

        const delay = isDeleting ? 35 : 80;
        const t = setTimeout(() => {
            setDisplayText(isDeleting
                ? displayText.slice(0, -1)
                : phrase.slice(0, displayText.length + 1)
            );
        }, delay);

        return () => clearTimeout(t);
    }, [displayText, isDeleting, phraseIndex]);

    return (
        <span>
            {displayText}
            <span className="animate-[blink_1s_step-end_infinite]">|</span>
        </span>
    );
}
