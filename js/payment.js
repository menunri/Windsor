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
        setTimeout(() => (copyBtn.textContent = "📋 Copy ID"), 2000);
      } catch {
        alert("Failed to copy Reservation ID");
      }
    });
  }

  // --- QR Popup functionality ---
  const qrPopup = document.getElementById("qrPopup");
  const closePopup = document.getElementById("closePopup");
  const popupTitle = document.getElementById("popupTitle");
  const popupQR = document.getElementById("popupQR");
  const popupInstruction = document.getElementById("popupInstruction");

  function openQRPopup(title, qrSrc, instruction) {
    popupTitle.textContent = title;
    popupQR.src = qrSrc;
    popupInstruction.textContent = instruction;
    qrPopup.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeQRPopup() {
    qrPopup.classList.remove("active");
    document.body.style.overflow = "";
  }

  closePopup.addEventListener("click", closeQRPopup);
  qrPopup.addEventListener("click", (e) => {
    if (e.target === qrPopup) closeQRPopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && qrPopup.classList.contains("active")) closeQRPopup();
  });

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

    const gcashQR = document.getElementById("gcashQR");
    const paymayaQR = document.getElementById("paymayaQR");

    gcashQR.src = gcash?.content || "";
    paymayaQR.src = paymaya?.content || "";

    // Click-to-view QR popup
    document.getElementById("gcashBox").addEventListener("click", () => {
      if (gcashQR.src) {
        openQRPopup(
          "GCash QR Code",
          gcashQR.src,
          "Scan this QR code with your GCash app to complete payment"
        );
      }
    });

    document.getElementById("paymayaBox").addEventListener("click", () => {
      if (paymayaQR.src) {
        openQRPopup(
          "PayMaya QR Code",
          paymayaQR.src,
          "Scan this QR code with your PayMaya app to complete payment"
        );
      }
    });

    // 🧾 Upload payment proof
    const form = document.getElementById("paymentProofForm");
    const status = document.getElementById("uploadStatus");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const file = document.getElementById("paymentImage").files[0];
      if (!file || !reservationId) {
        status.textContent = "⚠️ Missing file or reservation ID.";
        status.className = "status-message status-error";
        return;
      }

      status.textContent = "Uploading... Please wait.";
      status.className = "status-message status-info";

      const fileName = `${reservationId}_${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("payment_receipts")
        .upload(fileName, file);

      if (uploadError) {
        status.textContent = "❌ Upload failed. Please try again.";
        status.className = "status-message status-error";
        return;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from("payment_receipts")
        .getPublicUrl(fileName);

      // Insert payment proof record
      const { error: dbError } = await supabase.from("payment_proofs").insert({
        reservation_id: reservationId,
        image_url: publicUrlData.publicUrl,
        created_at: new Date(),
      });

      if (dbError) {
        status.textContent = "❌ Failed to save proof in database.";
        status.className = "status-message status-error";
        return;
      }

      // ✅ Success message + redirect
      status.textContent = "✅ Payment proof submitted successfully! Redirecting...";
      status.className = "status-message status-success";
      form.reset();

      // ⏳ Wait 2 seconds before redirect
      setTimeout(() => {
        window.location.href = "../pages/search.html"; // 🔁 Adjust path if needed
      }, 2000);
    });
  } catch (err) {
    console.error(err);
    document.getElementById("status").textContent =
      "⚠️ Failed to load payment methods.";
  }
});
