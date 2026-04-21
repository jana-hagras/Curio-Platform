import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    country: user?.country || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.update(user.id, form);
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, background: 'var(--white)', padding: 32, borderRadius: 'var(--radius-lg)' }}>
      <h1 style={{ marginBottom: 24 }}>My Profile</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Input label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
          <Input label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
        </div>
        <Input label="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
        {user.type === 'Buyer' && (
          <Input label="Country" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
        )}
        {user.type === 'Artisan' && (
          <TextArea label="Bio" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={4} />
        )}
        <Input label="Profile Image URL" value={form.profileImage} onChange={e => setForm({...form, profileImage: e.target.value})} />
        
        <Button type="submit" loading={loading} size="lg">Save Changes</Button>
      </form>
    </div>
  );
}
