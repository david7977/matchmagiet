document.addEventListener("DOMContentLoaded", function () {
  console.log("JavaScript está funcionando!");

  // Manejo del formulario de búsqueda
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const query = event.target.querySelector("input").value;
      searchProfiles(query);
    });
  }

  // Función para buscar perfiles
  function searchProfiles(query) {
    fetch(`/perfiles?search=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((perfiles) => {
        displayProfiles(perfiles);
      })
      .catch((error) => console.error("Error en la búsqueda de perfiles:", error));
  }

  // Cargar perfiles destacados desde el backend al cargar la página
  const perfilesArea = document.getElementById("perfilesArea");
  if (perfilesArea) {
    fetch("/perfiles")
      .then((response) => response.json())
      .then((perfiles) => {
        displayProfiles(perfiles);
      })
      .catch((error) => console.error("Error cargando perfiles:", error));
  }

  // Función para mostrar perfiles en el DOM
  function displayProfiles(perfiles) {
    perfilesArea.innerHTML = ""; // Limpiar perfiles anteriores
    perfiles.forEach((perfil) => {
      const perfilCard = document.createElement("div");
      perfilCard.classList.add("profile-card");
      perfilCard.innerHTML = `
        <img src="${perfil.imagen || "assets/profile-image.jpg"}" alt="${perfil.nombre}">
        <h3>${perfil.nombre}</h3>
        <p>${perfil.edad} años, ${perfil.ciudad}, ${perfil.intereses}</p>
        <a href="#">Ver perfil completo</a>
      `;
      perfilesArea.appendChild(perfilCard);
    });
  }
});
