function formatearFecha(fechaISO) {

    return new Date(fechaISO).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}


async function cargarNoticias() {

    const contenedor = document.getElementById("noticiasContainer");

    try {

        const respuesta = await fetch("/api/news");
        const noticias = await respuesta.json();

        if (!Array.isArray(noticias)) {

            contenedor.innerHTML = `<p class="vacio">Error cargando noticias.</p>`;
            return;

        }

        if (noticias.length === 0) {

            contenedor.innerHTML = `<p class="vacio">Todavía no hay noticias publicadas.</p>`;
            return;

        }

        contenedor.innerHTML = "";

        noticias.forEach(n => {

            const autor = n.users ? n.users.nombre : "Portal RER";

            const card = document.createElement("article");
            card.className = "noticia-card";

            card.innerHTML = `
                ${n.imagen_url ? `<img class="noticia-imagen" src="${n.imagen_url}" alt="">` : ""}
                <div class="noticia-body">
                    <h2 class="noticia-titulo"></h2>
                    <p class="noticia-meta">Por ${autor} · ${formatearFecha(n.created_at)}</p>
                    <p class="noticia-contenido"></p>
                </div>
            `;

            card.querySelector(".noticia-titulo").textContent = n.titulo;
            card.querySelector(".noticia-contenido").textContent = n.contenido || "";

            contenedor.appendChild(card);

        });

    } catch (error) {

        console.error(error);
        contenedor.innerHTML = `<p class="vacio">Error cargando noticias.</p>`;

    }

}

cargarNoticias();
