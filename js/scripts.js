// Esperar a que el formulario de registro sea enviado
document.getElementById('registro-form').addEventListener('submit', function(event) {
    // Evitar el comportamiento por defecto del formulario (recargar la página)
    event.preventDefault();
    
    // Obtener los valores de los campos del formulario
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Verificar que todos los campos estén completos
    if (nombre && email && password) {
        // Mostrar un mensaje de éxito
        alert('Usuario registrado con éxito');
        // Aquí podrías añadir lógica para enviar los datos a un servidor, por ejemplo.
    } else {
        // Mostrar un mensaje de error si faltan campos
        alert('Por favor, completa todos los campos');
    }
});
