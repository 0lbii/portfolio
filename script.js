function openSection(section) {
    const content = document.getElementById("content");
    content.classList.remove("hidden");

    if (section === "about") {
        content.innerHTML = "<h2>Sobre mí</h2><p>Hola 👋 Soy un desarrollador apasionado por crear experiencias interactivas inspiradas en el estilo PS Vita.</p>";
    } else if (section === "projects") {
        content.innerHTML = "<h2>Proyectos</h2><p>Aquí mostraré mis proyectos más destacados con animaciones y efectos.</p>";
    } else if (section === "contact") {
        content.innerHTML = "<h2>Contacto</h2><p>Puedes escribirme a <b>miemail@ejemplo.com</b> o seguirme en redes sociales.</p>";
    }
}
