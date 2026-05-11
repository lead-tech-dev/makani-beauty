import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { productVariantsService, VariantPayload } from "../../services/productVariants";
import type { ApiProductVariant } from "../../lib/api";
import shared from "./admin.module.scss";

interface DraftVariant extends VariantPayload {
  id?: string;
  _new?: boolean;
}

const apiToDraft = (v: ApiProductVariant): DraftVariant => ({
  id: v.id,
  attributes: { ...v.attributes },
  stock: v.stock,
  sku: v.sku ?? "",
  priceOverride: v.priceOverride != null ? Number(v.priceOverride) : undefined,
  imageUrl: v.imageUrl ?? "",
  displayOrder: v.displayOrder ?? 0,
  isActive: v.isActive ?? true,
});

interface Props {
  productId: string;
  /** Predefined attribute axes — guides the form. Default ["size","color"]. */
  axes?: string[];
}

const VariantsEditor = ({ productId, axes = ["size", "color"] }: Props) => {
  const [variants, setVariants] = useState<DraftVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    productVariantsService
      .list(productId)
      .then((vs) => setVariants(vs.map(apiToDraft)))
      .catch((e: any) => setError(e?.response?.data?.message ?? "Erreur"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const addRow = () => {
    setVariants((vs) => [
      ...vs,
      {
        attributes: Object.fromEntries(axes.map((a) => [a, ""])),
        stock: 0,
        sku: "",
        priceOverride: undefined,
        imageUrl: "",
        displayOrder: vs.length,
        isActive: true,
        _new: true,
      },
    ]);
  };

  const updateRow = (idx: number, patch: Partial<DraftVariant>) => {
    setVariants((vs) =>
      vs.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    );
  };

  const updateAttr = (idx: number, axis: string, value: string) => {
    setVariants((vs) =>
      vs.map((v, i) =>
        i === idx ? { ...v, attributes: { ...v.attributes, [axis]: value } } : v,
      ),
    );
  };

  const saveRow = async (idx: number) => {
    const v = variants[idx];
    setSavingId(v.id ?? `new-${idx}`);
    setError(null);
    try {
      const payload: VariantPayload = {
        attributes: Object.fromEntries(
          Object.entries(v.attributes).filter(([, val]) => val.trim() !== ""),
        ),
        stock: Number(v.stock) || 0,
        sku: v.sku || undefined,
        priceOverride:
          v.priceOverride != null && !isNaN(Number(v.priceOverride))
            ? Number(v.priceOverride)
            : undefined,
        imageUrl: v.imageUrl || undefined,
        displayOrder: v.displayOrder ?? 0,
        isActive: v.isActive ?? true,
      };
      if (v.id) {
        const updated = await productVariantsService.update(productId, v.id, payload);
        setVariants((vs) => vs.map((x, i) => (i === idx ? apiToDraft(updated) : x)));
      } else {
        const created = await productVariantsService.create(productId, payload);
        setVariants((vs) => vs.map((x, i) => (i === idx ? apiToDraft(created) : x)));
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSavingId(null);
    }
  };

  const removeRow = async (idx: number) => {
    const v = variants[idx];
    if (v.id && !window.confirm(`Supprimer la variante "${Object.values(v.attributes).join(" / ")}" ?`)) return;
    if (v.id) {
      try {
        await productVariantsService.remove(productId, v.id);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Erreur");
        return;
      }
    }
    setVariants((vs) => vs.filter((_, i) => i !== idx));
  };

  if (loading) return <p style={{ fontSize: "0.85rem", color: "#888" }}>Chargement…</p>;

  return (
    <div>
      {error && (
        <p
          style={{
            color: "#c0392b",
            fontSize: "0.82rem",
            background: "rgba(192,57,43,0.06)",
            border: "1px solid rgba(192,57,43,0.3)",
            padding: "0.6rem 0.85rem",
            borderRadius: 8,
            marginBottom: "0.75rem",
          }}
        >
          {error}
        </p>
      )}

      {variants.length === 0 ? (
        <p style={{ fontSize: "0.88rem", color: "#888", margin: "0 0 0.85rem" }}>
          Aucune variante. Ajoute des tailles, couleurs ou longueurs si ce produit en a besoin
          (vêtements, mèches, perruques). Sinon laisse vide — le produit utilisera son stock global.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #C9BCA1" }}>
                {axes.map((a) => (
                  <th key={a} style={th}>{a}</th>
                ))}
                <th style={th}>Stock</th>
                <th style={th}>Prix override</th>
                <th style={th}>SKU</th>
                <th style={{ ...th, width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <tr key={v.id ?? `new-${idx}`} style={{ borderBottom: "1px solid #E5DCC9" }}>
                  {axes.map((a) => (
                    <td key={a} style={td}>
                      <input
                        value={v.attributes[a] ?? ""}
                        onChange={(e) => updateAttr(idx, a, e.target.value)}
                        placeholder={a === "size" ? "M" : a === "color" ? "noir" : ""}
                        style={inputStyle}
                      />
                    </td>
                  ))}
                  <td style={td}>
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => updateRow(idx, { stock: Number(e.target.value) || 0 })}
                      style={{ ...inputStyle, width: 70 }}
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      step="0.01"
                      value={v.priceOverride ?? ""}
                      onChange={(e) =>
                        updateRow(idx, {
                          priceOverride: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      placeholder="—"
                      style={{ ...inputStyle, width: 90 }}
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={v.sku ?? ""}
                      onChange={(e) => updateRow(idx, { sku: e.target.value })}
                      placeholder="SKU"
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ ...td, display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      className={shared.btnIcon}
                      onClick={() => saveRow(idx)}
                      disabled={savingId === (v.id ?? `new-${idx}`)}
                      title="Sauvegarder"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${shared.btnIcon} ${shared.danger}`}
                      onClick={() => removeRow(idx)}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        className={shared.btnSecondary}
        onClick={addRow}
        style={{ marginTop: "0.85rem" }}
      >
        <Plus size={14} /> Ajouter une variante
      </button>
    </div>
  );
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.4rem",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "0.65rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#231B14",
  fontWeight: 700,
};

const td: React.CSSProperties = {
  padding: "0.55rem 0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.7rem",
  border: "1px solid #C9BCA1",
  borderRadius: 8,
  fontFamily: "Inter, sans-serif",
  fontSize: "0.85rem",
  background: "#FBF6EF",
};

export default VariantsEditor;
