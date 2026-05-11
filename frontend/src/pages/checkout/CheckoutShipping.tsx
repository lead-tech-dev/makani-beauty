import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, ChevronLeft, ChevronRight, Truck, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { trackBeginCheckout, trackAddShippingInfo } from '../../lib/analytics';
import { addressesService } from '../../services/addresses';
import { shippingService } from '../../services/shipping';
import AddressFormModal from '../../components/AddressFormModal/AddressFormModal';
import type { Address } from '../../types';
import type { ShippingCalc } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import styles from './step.module.scss';

const CheckoutShipping = () => {
  const { items, subtotal } = useCart();
  const {
    setFulfillmentMethod,
    setShippingSpeed,
    selectedAddressId, setSelectedAddressId,
    notes, setNotes,
  } = useCheckout();
  const navigate = useNavigate();
  const currency = items[0]?.currency ?? '€';

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [shipping, setShipping] = useState<ShippingCalc | null>(null);

  // Colissimo home delivery is the only option
  useEffect(() => {
    setFulfillmentMethod('delivery');
    setShippingSpeed('standard');
  }, [setFulfillmentMethod, setShippingSpeed]);

  useEffect(() => {
    if (items.length > 0) trackBeginCheckout(items, currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    addressesService.getAll().then((list) => {
      setAddresses(list);
      if (!selectedAddressId) {
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setSelectedAddressId(def.id);
      }
      if (list.length === 0) setAddressModalOpen(true);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    let alive = true;
    if (!selectedAddress) { setShipping(null); return; }
    shippingService.calculate(
      selectedAddress.country,
      subtotal,
      items.map((i) => ({ productId: i.id, quantity: i.quantity })),
    ).then((calc) => {
      if (!alive) return;
      setShipping({ ...calc, zoneName: `Colissimo · ${calc.zoneName}` });
    }).catch(() => alive && setShipping(null));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress?.id, subtotal]);

  const blockingHint = !selectedAddressId ? 'Choisissez une adresse de livraison' : null;
  const canContinue = !blockingHint;

  const handleAddressSaved = (addr: Address) => {
    setAddresses((prev) => [addr, ...prev]);
    setSelectedAddressId(addr.id);
  };

  if (loading) return <Spinner />;

  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Truck size={18} /> Livraison à domicile
        </h2>

        <div className={styles.modePanel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}><MapPin size={16} /> Adresse de livraison</h3>
          </div>

          {addresses.length === 0 ? (
            <button type="button" className={styles.addressEmpty} onClick={() => setAddressModalOpen(true)}>
              <Plus size={18} /> Ajouter une adresse
            </button>
          ) : (
            <>
              <div className={styles.addressList}>
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selectedAddr : ''}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div>
                      <strong>{addr.fullName}</strong>
                      <span>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</span>
                      <span>{addr.postalCode} {addr.city}, {addr.country}</span>
                      {addr.phone && <span>{addr.phone}</span>}
                    </div>
                    {addr.isDefault && <span className={styles.defaultBadge}>Par défaut</span>}
                  </label>
                ))}
              </div>
              <button type="button" className={styles.addAddressBtn} onClick={() => setAddressModalOpen(true)}>
                <Plus size={14} /> Ajouter une adresse
              </button>
            </>
          )}

          <details className={styles.notesDetails}>
            <summary>Ajouter une note pour la livraison</summary>
            <textarea
              className={styles.notesField}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Code de l immeuble, étage, instructions…"
              rows={3}
            />
          </details>
        </div>
      </section>

      <aside className={styles.summary}>
        <h2 className={styles.cardTitle}>Récapitulatif</h2>

        <div className={styles.summaryRow}>
          <span>{items.length} article{items.length !== 1 ? 's' : ''}</span>
          <span>{currency}{subtotal.toFixed(2)}</span>
        </div>

        <div className={styles.summaryShip}>
          <div className={styles.summaryShipHead}>
            <span className={styles.summaryShipLabel}>Livraison</span>
            {shipping
              ? <strong className={styles.summaryShipPrice}>
                  {shipping.shippingFee === 0 ? 'Offerte' : `${currency}${shipping.shippingFee.toFixed(2)}`}
                </strong>
              : <span className={styles.summaryShipPlaceholder}>—</span>}
          </div>
          {shipping && (
            <span className={styles.summaryShipCarrier}>{shipping.zoneName}</span>
          )}
          {!shipping && blockingHint && (
            <span className={styles.summaryShipHint}>
              <Info size={12} /> {blockingHint}
            </span>
          )}
        </div>

        {shipping && (
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <strong>Total estimé</strong>
            <strong>{currency}{(subtotal + shipping.shippingFee).toFixed(2)}</strong>
          </div>
        )}

        <button
          className={styles.primaryBtn}
          onClick={() => {
            trackAddShippingInfo(items, 'standard', currency);
            navigate('/checkout/payment');
          }}
          disabled={!canContinue}
          data-testid="continue-to-payment"
        >
          Continuer vers le paiement <ChevronRight size={18} />
        </button>

        {blockingHint && (
          <p className={styles.summaryWarn}><Info size={13} /> {blockingHint}</p>
        )}

        <Link to="/checkout/cart" className={styles.backLink}>
          <ChevronLeft size={14} /> Retour au panier
        </Link>
      </aside>

      <AddressFormModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSaved={handleAddressSaved}
      />
    </div>
  );
};

export default CheckoutShipping;
