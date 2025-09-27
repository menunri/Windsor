   import { supabase } from '../serverClient.js';

    async function updateNewPassword() {
      const newPassword = document.getElementById('newPassword').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();
      const errorMsg = document.getElementById('errorMsg');

      errorMsg.textContent = ''; // clear previous errors

      if (!newPassword || !confirmPassword) {
        errorMsg.textContent = 'Please fill in both password fields.';
        return;
      }

      if (newPassword !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match.';
        return;
      }

      if (!validatePasswordStrength(newPassword)) {
        errorMsg.textContent = 'Password must be at least 8 characters and include a number and symbol.';
        return;
      }

      try {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
          alert(error.message);
        } else {
          alert('Password updated successfully!');
          window.location.href = '../index.html';
        }
      } catch (err) {
        alert('Unexpected error: ' + err.message);
      }
    }

    function validatePasswordStrength(password) {
      // Min 8 chars, at least one number and one special character
      const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
      return regex.test(password);
    }

    function togglePassword(fieldId, toggleIcon) {
      const input = document.getElementById(fieldId);
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      toggleIcon.innerHTML = isHidden ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    }

    // Allow Enter key to trigger the form
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        updateNewPassword();
      }
    });

    window.updateNewPassword = updateNewPassword;
    window.togglePassword = togglePassword;