import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import { uploadService } from "../../services/uploadService";
import Input from "../../components/ui/Input";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import { FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, refreshUser, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    country: user?.country || "",
    bio: user?.bio || "",
    profileImage: user?.profileImage || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const getImageSrc = () => {
    if (previewUrl) return previewUrl;
    if (form.profileImage) {
      return form.profileImage.startsWith('/') ? `http://localhost:3000${form.profileImage}` : form.profileImage;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = form.profileImage;

      if (imageFile) {
        try {
          const uploadRes = await uploadService.uploadImage(imageFile);
          if (uploadRes?.imageUrl) {
            finalImageUrl = uploadRes.imageUrl;
          } else if (uploadRes?.data?.imageUrl) {
            finalImageUrl = uploadRes.data.imageUrl;
          }
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          toast.error("Image upload failed, saving other changes.");
        }
      }

      const payload = {
        fName: form.firstName,
        lName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        profileImage: finalImageUrl,
      };

      if (user.type === "Buyer") payload.country = form.country;
      if (user.type === "Artisan") payload.bio = form.bio;

      await userService.update(user.id, payload);

      // Update local user state immediately
      const updatedUser = {
        ...user,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        profileImage: finalImageUrl,
        ...(user.type === 'Buyer' ? { country: form.country } : {}),
        ...(user.type === 'Artisan' ? { bio: form.bio } : {}),
      };
      setUser(updatedUser);

      setForm(prev => ({ ...prev, profileImage: finalImageUrl }));
      setImageFile(null);
      setPreviewUrl(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const imgSrc = getImageSrc();

  return (
    <div style={{ maxWidth: 600, animation: 'fadeInUp 0.4s ease forwards' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>My Profile</h1>
      <div style={{ background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gold-primary)', color: 'var(--black-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, overflow: 'hidden' }}>
              {imgSrc ? <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`}
            </div>
            <label style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%', background: 'var(--black-deep)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', border: '2px solid var(--surface-primary)' }}>
              <FiCamera />
              <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{user?.firstName} {user?.lastName}</h3>
            <p style={{ fontSize: 13, color: 'var(--gold-primary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.type}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {user.type === "Buyer" && <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />}
          {user.type === "Artisan" && <TextArea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} />}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Profile Image URL</label>
            <Input placeholder="https://example.com/photo.jpg" value={form.profileImage} onChange={(e) => setForm({ ...form, profileImage: e.target.value })} />
          </div>

          <Button type="submit" loading={loading} size="lg" fullWidth>Save Changes</Button>
        </form>
      </div>
    </div>
  );
}
