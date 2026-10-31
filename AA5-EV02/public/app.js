// Cliente de demostración: la validación definitiva siempre se realiza en la API.
const form = document.querySelector('#auth-form');
const usernameInput = document.querySelector('#usuario');
const passwordInput = document.querySelector('#contrasena');
const submitButton = document.querySelector('#submit-button');
const registerButton = document.querySelector('#register-mode');
const loginButton = document.querySelector('#login-mode');
const toggleButton = document.querySelector('#toggle-password');
const statusMessage = document.querySelector('#status-message');
const responseCode = document.querySelector('#response-code');
const responseBody = document.querySelector('#json-response');
const resultCard = document.querySelector('.result-card');
let mode = 'registro';

function selectMode(nextMode) {
  mode = nextMode;
  const registering = mode === 'registro';
  registerButton.classList.toggle('active', registering);
  loginButton.classList.toggle('active', !registering);
  registerButton.setAttribute('aria-pressed', String(registering));
  loginButton.setAttribute('aria-pressed', String(!registering));
  document.querySelector('#form-title').textContent = registering ? 'Comienza aquí' : 'Qué bueno verte';
  document.querySelector('#form-description').textContent = registering
    ? 'Elige un usuario y una contraseña para registrarte.'
    : 'Ingresa los datos de la cuenta que ya registraste.';
  submitButton.textContent = registering ? 'Crear cuenta →' : 'Iniciar sesión →';
  passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
  passwordInput.value = '';
  passwordInput.type = 'password';
  toggleButton.textContent = 'Mostrar';
  toggleButton.setAttribute('aria-label', 'Mostrar contraseña');
  toggleButton.setAttribute('aria-pressed', 'false');
  responseBody.hidden = true;
  resultCard.classList.remove('error');
  responseCode.textContent = 'EN ESPERA';
  statusMessage.textContent = 'Completa el formulario para ver el resultado de tu solicitud.';
}

registerButton.addEventListener('click', () => selectMode('registro'));
loginButton.addEventListener('click', () => selectMode('login'));
toggleButton.addEventListener('click', () => {
  const reveal = passwordInput.type === 'password';
  passwordInput.type = reveal ? 'text' : 'password';
  toggleButton.textContent = reveal ? 'Ocultar' : 'Mostrar';
  toggleButton.setAttribute('aria-label', reveal ? 'Ocultar contraseña' : 'Mostrar contraseña');
  toggleButton.setAttribute('aria-pressed', String(reveal));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  registerButton.disabled = true;
  loginButton.disabled = true;
  responseBody.hidden = true;
  resultCard.classList.remove('error');
  statusMessage.textContent = 'Procesando solicitud…';
  responseCode.textContent = 'ENVIANDO';
  try {
    const response = await fetch(`/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: usernameInput.value, contrasena: passwordInput.value }),
    });
    const result = await response.json();
    resultCard.classList.toggle('error', !response.ok);
    responseCode.textContent = `HTTP ${response.status}`;
    const details = result.errores ? ` ${Object.values(result.errores).join(' ')}` : '';
    statusMessage.textContent = result.mensaje + details;
    // textContent evita interpretar como HTML cualquier dato de la respuesta.
    responseBody.textContent = JSON.stringify(result, null, 2);
    responseBody.hidden = false;
    if (response.ok) {
      usernameInput.value = result.usuario.usuario;
      passwordInput.value = '';
    }
  } catch {
    resultCard.classList.add('error');
    responseCode.textContent = 'SIN CONEXIÓN';
    statusMessage.textContent = 'No fue posible conectar. Comprueba que el servicio siga abierto en la terminal.';
  } finally {
    submitButton.disabled = false;
    registerButton.disabled = false;
    loginButton.disabled = false;
  }
});
