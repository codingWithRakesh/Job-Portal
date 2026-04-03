function navigate(fromId, toId) {
      document.getElementById(fromId).classList.remove('active');
      document.getElementById(toId).classList.add('active');
    }

    // Handle 'Show Password' Toggle for Page 4
    function togglePasswordVisibility(checkbox) {
      const passInput = document.getElementById('new-password');
      const confirmInput = document.getElementById('confirm-password');
      const type = checkbox.checked ? 'text' : 'password';
      passInput.type = type;
      confirmInput.type = type;
    }