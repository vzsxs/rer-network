const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {

    window.location.href = "login.html";

}

document.getElementById("nombre").textContent = usuario.nombre;

document.getElementById("rol").textContent = usuario.rol;


document.getElementById("logout").addEventListener("click", () => {

    localStorage.removeItem("token");

    localStorage.removeItem("usuario");

    window.location.href = "index.html";

});