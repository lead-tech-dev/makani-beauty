import { useEffect, useState, useMemo } from 'react';
import { Search, Users as UsersIcon, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { adminUsers } from '../../services/admin';
import type { ApiUser } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';

const AdminUsers = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminUsers.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return users;
    return users.filter((u) =>
      u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }, [users, search]);

  const toggleAdmin = async (u: ApiUser) => {
    const newRole = u.role === 'admin' ? 'client' : 'admin';
    if (!window.confirm(`Définir "${u.fullName}" comme ${newRole === 'admin' ? 'administrateur' : 'client'} ?`)) return;
    try {
      const updated = await adminUsers.update(u.id, { role: newRole });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ...updated } : x));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    }
  };

  const toggleActive = async (u: ApiUser) => {
    if (!window.confirm(`${u.isActive ? 'Désactiver' : 'Réactiver'} le compte de "${u.fullName}" ?`)) return;
    try {
      const updated = await adminUsers.update(u.id, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ...updated } : x));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <Spinner fullPage />;

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const clientCount = users.length - adminCount;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Utilisateurs</h1>
          <p className={shared.sub}>{users.length} compte{users.length !== 1 ? 's' : ''} · {adminCount} admin · {clientCount} client{clientCount !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <div className={shared.filters}>
        <input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          {search ? <Search size={42} /> : <UsersIcon size={42} />}
          <h3>Aucun utilisateur</h3>
          <p>{search ? 'Aucun résultat.' : 'Aucun compte enregistré.'}</p>
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>État</th>
                <th>Inscrit le</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.fullName}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || <span style={{ color: '#bbb' }}>—</span>}</td>
                  <td>
                    <span className={`${shared.badge} ${u.role === 'admin' ? shared.confirmed : shared.muted}`}>
                      {u.role === 'admin' ? 'Admin' : 'Client'}
                    </span>
                  </td>
                  <td>
                    <span className={`${shared.badge} ${u.isActive ? shared.success : shared.danger}`}>
                      {u.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className={shared.actions}>
                      <button
                        onClick={() => toggleAdmin(u)}
                        className={shared.btnIcon}
                        title={u.role === 'admin' ? 'Retirer le rôle admin' : 'Promouvoir en admin'}
                      >
                        {u.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`${shared.btnIcon} ${!u.isActive ? '' : shared.danger}`}
                        title={u.isActive ? 'Désactiver' : 'Réactiver'}
                      >
                        <ShieldCheck size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
