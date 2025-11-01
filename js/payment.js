// Disable console logs for production
console.log = console.debug = console.info = () => {};

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const reservationId = params.get("reservation_id");

  // Clean URL (remove ?reservation_id=)
  window.history.replaceState({}, document.title, window.location.pathname);

  // Display reservation ID
  const reservationEl = document.getElementById("reservationId");
  const reservationInput = document.getElementById("reservationInput");
  if (reservationEl) reservationEl.textContent = reservationId || "❌ None";
  if (reservationInput) reservationInput.value = reservationId || "";

  // 📋 Copy button feature
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn && reservationId) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(reservationId);
        copyBtn.textContent = "✅ Copied!";
        setTimeout(() => (copyBtn.textContent = "📋 Copy"), 2000);
      } catch {
        alert("Failed to copy Reservation ID");
      }
    });
  }

  // ✅ Load payment QR codes
  try {
    const { supabase } = await import("../serverClient.js");
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .in("type", ["gcash_qr", "paymaya_qr"]);

    if (error) throw error;

    const gcash = data.find((i) => i.type === "gcash_qr");
    const paymaya = data.find((i) => i.type === "paymaya_qr");

    document.getElementById("gcashQR").src = gcash?.content || "";
    document.getElementById("paymayaQR").src = paymaya?.content || "";

    // 🧾 Upload handler
    const form = document.getElementById("paymentProofForm");
    const status = document.getElementById("uploadStatus");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const file = document.getElementById("paymentImage").files[0];
      if (!file || !reservationId) {
        status.textContent = "⚠️ Missing file or reservation ID.";
        return;
      }

      status.textContent = "Uploading... Please wait.";

      // Upload to Supabase Storage (e.g., 'payment_receipts')
      const fileName = `${reservationId}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadedFile, error: uploadError } = await supabase.storage
        .from("payment_receipts")
        .upload(fileName, file);

      if (uploadError) {
        status.textContent = "❌ Upload failed.";
        return;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from("payment_receipts")
        .getPublicUrl(fileName);

      // Insert into payment_proofs table
      const { error: dbError } = await supabase.from("payment_proofs").insert({
        reservation_id: reservationId,
        image_url: publicUrlData.publicUrl,
        created_at: new Date(),
      });

      if (dbError) {
        status.textContent = "❌ Failed to save proof in database.";
        return;
      }

      status.textContent = "✅ Payment proof submitted successfully!";
      form.reset();
    });
  } catch {
    document.getElementById("status").textContent =
      "⚠️ Failed to load payment methods.";
  }
});
