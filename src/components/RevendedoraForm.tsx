"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  nome: string;
  email: string;
  cedula: string;
  edad: string;
  direccion: string;
  estado_civil: string;
  hijos: string;
  instagram: string;
  whatsapp: string;
  empresa: string;
  informconf: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

const EMPTY: FormData = {
  nome: "",
  email: "",
  cedula: "",
  edad: "",
  direccion: "",
  estado_civil: "",
  hijos: "",
  instagram: "",
  whatsapp: "",
  empresa: "",
  informconf: "",
};

function validate(form: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.nome.trim()) errors.nome = "El nombre es obligatorio";
  if (!form.cedula.trim()) errors.cedula = "La cédula es obligatoria";
  if (!form.email.trim()) {
    errors.email = "El correo es obligatorio";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Ingresá un correo válido";
  }
  if (!form.whatsapp.trim()) errors.whatsapp = "El WhatsApp es obligatorio";
  if (!form.edad.trim()) errors.edad = "La edad es obligatoria";
  else if (Number(form.edad) < 18) errors.edad = "Debés tener al menos 18 años";
  if (!form.estado_civil) errors.estado_civil = "Seleccioná tu estado civil";
  if (!form.hijos) errors.hijos = "Seleccioná una opción";
  if (!form.instagram.trim()) errors.instagram = "El Instagram es obligatorio";
  if (!form.direccion.trim()) errors.direccion = "La dirección es obligatoria";
  if (!form.empresa.trim()) errors.empresa = "Este campo es obligatorio";
  if (!form.informconf.trim()) errors.informconf = "Este campo es obligatorio";
  return errors;
}

export default function RevendedoraForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitted) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorField = document.querySelector("[data-field-error]");
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setServerError("Ocurrió un error al enviar. Intentá de nuevo en unos minutos.");
        return;
      }

      router.push("/revendedora/obrigado");
    } catch {
      setServerError("Error de conexión. Verificá tu internet e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full px-0 py-3 border-b bg-transparent text-dark text-sm placeholder:text-dark/40 focus:outline-none transition-colors";
  const selectBase =
    "w-full px-0 py-3 border-b bg-transparent text-dark text-sm focus:outline-none transition-colors appearance-none cursor-pointer";
  const labelClass = "block text-[10px] tracking-[0.15em] uppercase text-dark/50 mb-1 mt-6";

  function inputCls(field: keyof FormData) {
    return `${inputBase} ${fieldErrors[field] ? "border-red-400 focus:border-red-500" : "border-dark/20 focus:border-dark"}`;
  }
  function selectCls(field: keyof FormData) {
    return `${selectBase} ${fieldErrors[field] ? "border-red-400 focus:border-red-500" : "border-dark/20 focus:border-dark"}`;
  }
  function FieldError({ field }: { field: keyof FormData }) {
    if (!fieldErrors[field]) return null;
    return (
      <p data-field-error className="mt-1 text-xs text-red-500">
        {fieldErrors[field]}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
        {/* Nombre */}
        <div>
          <label className={labelClass}>Nombre completo *</label>
          <input
            type="text"
            placeholder="Tu nombre y apellido"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            className={inputCls("nome")}
          />
          <FieldError field="nome" />
        </div>

        {/* Cédula */}
        <div>
          <label className={labelClass}>Número de cédula *</label>
          <input
            type="text"
            placeholder="CI sin puntos ni guiones"
            value={form.cedula}
            onChange={(e) => set("cedula", e.target.value)}
            className={inputCls("cedula")}
          />
          <FieldError field="cedula" />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Correo electrónico *</label>
          <input
            type="email"
            placeholder="tucorreo@email.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls("email")}
          />
          <FieldError field="email" />
        </div>

        {/* WhatsApp */}
        <div>
          <label className={labelClass}>Número de WhatsApp *</label>
          <input
            type="tel"
            placeholder="+595 9XX XXX XXX"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            className={inputCls("whatsapp")}
          />
          <FieldError field="whatsapp" />
        </div>

        {/* Edad */}
        <div>
          <label className={labelClass}>Edad *</label>
          <input
            type="number"
            min={18}
            placeholder="Años cumplidos"
            value={form.edad}
            onChange={(e) => set("edad", e.target.value)}
            className={inputCls("edad")}
          />
          <FieldError field="edad" />
        </div>

        {/* Estado civil */}
        <div>
          <label className={labelClass}>Estado civil *</label>
          <select
            value={form.estado_civil}
            onChange={(e) => set("estado_civil", e.target.value)}
            className={selectCls("estado_civil")}
          >
            <option value="" disabled>Seleccioná una opción</option>
            <option value="Soltera">Soltera</option>
            <option value="Casada">Casada</option>
            <option value="Divorciada">Divorciada</option>
            <option value="Viuda">Viuda</option>
            <option value="Unión libre">Unión libre</option>
          </select>
          <FieldError field="estado_civil" />
        </div>

        {/* Hijos */}
        <div>
          <label className={labelClass}>¿Cuántos hijos tenés? *</label>
          <select
            value={form.hijos}
            onChange={(e) => set("hijos", e.target.value)}
            className={selectCls("hijos")}
          >
            <option value="" disabled>Seleccioná una opción</option>
            <option value="Ninguno">Ninguno</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4 o más">4 o más</option>
          </select>
          <FieldError field="hijos" />
        </div>

        {/* Instagram */}
        <div>
          <label className={labelClass}>¿Cuál es tu Instagram? *</label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-dark/40 text-sm pt-px">@</span>
            <input
              type="text"
              placeholder="tuusuario"
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className={`${inputCls("instagram")} pl-5`}
            />
          </div>
          <FieldError field="instagram" />
        </div>

        {/* Dirección — full width */}
        <div className="md:col-span-2">
          <label className={labelClass}>Dirección completa *</label>
          <input
            type="text"
            placeholder="Ciudad, barrio, departamento"
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            className={inputCls("direccion")}
          />
          <FieldError field="direccion" />
        </div>

        {/* Empresa */}
        <div className="md:col-span-2">
          <label className={labelClass}>¿Dónde trabajás actualmente? *</label>
          <input
            type="text"
            placeholder="Nombre de la empresa o 'No trabajo'"
            value={form.empresa}
            onChange={(e) => set("empresa", e.target.value)}
            className={inputCls("empresa")}
          />
          <FieldError field="empresa" />
        </div>

        {/* Informconf — full width */}
        <div className="md:col-span-2">
          <label className={labelClass}>¿Estás en Informconf? *</label>
          <textarea
            rows={3}
            placeholder="Si estás en Informconf, contanos el motivo. Si no, escribí 'No'."
            value={form.informconf}
            onChange={(e) => set("informconf", e.target.value)}
            className={`${inputCls("informconf")} resize-none`}
          />
          <FieldError field="informconf" />
        </div>
      </div>

      {serverError && (
        <p className="mt-6 text-sm text-red-500">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-10 w-full md:w-auto px-12 py-4 bg-black text-white text-xs tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
