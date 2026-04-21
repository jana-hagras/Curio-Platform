import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import { uploadService } from "../../services/uploadService";
import Input from "../../components/ui/Input";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
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

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = form.profileImage;

      if (imageFile) {
        const uploadRes = await uploadService.uploadImage(imageFile);
        if (uploadRes.ok && uploadRes.imageUrl) {
          finalImageUrl = uploadRes.imageUrl;
        } else {
          throw new Error("Upload failed");
        }
      }

      await userService.update(user.id, {
        ...form,
        fName: form.firstName,
        lName: form.lastName,
        profileImage: finalImageUrl,
      });
      await refreshUser();
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        background: "var(--white)",
        padding: 32,
        borderRadius: "var(--radius-lg)",
      }}
    >
      <h1 style={{ marginBottom: 24 }}>My Profile</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>
        <Input
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        {user.type === "Buyer" && (
          <Input
            label="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        )}
        {user.type === "Artisan" && (
          <TextArea
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--gray-700)",
            }}
          >
            Profile Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
            Or provide an image URL below
          </p>
          <Input
            placeholder="https://images.unsplash.com/photo-..."
            value={form.profileImage}
            onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
          />
          {(imageFile || form.profileImage) && (
            <div style={{ marginTop: 8 }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--green-600)",
                  fontWeight: 600,
                }}
              >
                Image updated!
              </p>
            </div>
          )}
        </div>

        <Button type="submit" loading={loading} size="lg">
          Save Changes
        </Button>
      </form>
    </div>
  );
}
