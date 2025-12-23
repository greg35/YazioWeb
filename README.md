# YazioWeb

<p align="center">
  <img src="screenshots/01. Homepage.png" width="200" alt="Homepage" style="margin: 5px;">
  <img src="screenshots/02. Weekly View.png" width="200" alt="Weekly View" style="margin: 5px;">
  <img src="screenshots/03. Day Selector.png" width="200" alt="Day Selector" style="margin: 5px;">
  <img src="screenshots/04. Day Details.png" width="200" alt="Day Details" style="margin: 5px;">
</p>

**[English](#english) | [Français](#français)**

---

<a name="english"></a>
## 🇬🇧 English

**YazioWeb** is a web dashboard that allows you to visualize and print your Yazio nutrition data. It provides a clear weekly view of your calorie and macronutrient intake, with the ability to print detailed reports.

### Features

- **Weekly View**: Visualize your nutrition data week by week.
- **Detailed Daily Breakdown**: See calories, protein, carbs, and fat for each day and meal.
- **Print Reports**: Generate printable PDF reports for specific date ranges (one week per page).
- **Multi-language**: Supports English and French.

### Installation & Usage

1.  **Prerequisites**:
    - Node.js and npm installed.
    - Python installed.
    - A Yazio account.

2.  **Setup**:
    - Clone the repository.
    - Install frontend dependencies:
      ```bash
      cd frontend
      npm install
      ```
    - Install backend dependencies:
      ```bash
      cd backend
      pip install -r requirements.txt
      ```

3.  **Running the App**:
    - Use the provided start script:
      ```bash
      ./start.sh
      ```
    - This will start both the backend (Python) and frontend (Vite) servers.
    - Open your browser at `http://localhost:5173`.

### Credits

This project uses **YazioExporter** to fetch data from Yazio.
Huge thanks to **[funmelon64 (Morph)](https://github.com/funmelon64)** for creating this amazing tool!
- GitHub Repository: [Yazio-Exporter](https://github.com/funmelon64/Yazio-Exporter)

---

<a name="français"></a>
## 🇫🇷 Français

**YazioWeb** est un tableau de bord web qui vous permet de visualiser et d'imprimer vos données nutritionnelles Yazio. Il offre une vue hebdomadaire claire de votre apport en calories et macronutriments, avec la possibilité d'imprimer des rapports détaillés.

### Fonctionnalités

- **Vue Hebdomadaire**: Visualisez vos données nutritionnelles semaine par semaine.
- **Détails Journaliers**: Consultez les calories, protéines, glucides et lipides pour chaque jour et chaque repas.
- **Impression de Rapports**: Générez des rapports PDF imprimables pour des plages de dates spécifiques (une semaine par page).
- **Multi-langue**: Supporte l'anglais et le français.

### Installation et Utilisation

1.  **Prérequis**:
    - Node.js et npm installés.
    - Python installé.
    - Un compte Yazio.

2.  **Installation**:
    - Clonez le dépôt.
    - Installez les dépendances frontend :
      ```bash
      cd frontend
      npm install
      ```
    - Installez les dépendances backend :
      ```bash
      cd backend
      pip install -r requirements.txt
      ```

3.  **Lancement de l'application**:
    - Utilisez le script de démarrage fourni :
      ```bash
      ./start.sh
      ```
    - Cela démarrera à la fois le serveur backend (Python) et le serveur frontend (Vite).
    - Ouvrez votre navigateur à l'adresse `http://localhost:5173`.

### Crédits

Ce projet utilise **YazioExporter** pour récupérer les données de Yazio.
Un grand merci à **[funmelon64 (Morph)](https://github.com/funmelon64)** pour avoir créé cet outil incroyable !
- Dépôt GitHub : [Yazio-Exporter](https://github.com/funmelon64/Yazio-Exporter)
