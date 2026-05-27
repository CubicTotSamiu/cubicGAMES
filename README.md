# 🎮 cubic.games Retro Portal 🎮

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **cubic.games Retro Portal** — это интерактивная ностальгическая среда, вдохновленная операционной системой Windows XP и эстетикой ранних 2000-х годов. Полнофункциональная рабочий стол с играми, симулятором Paint, поддержкой воспроизведения фоновой музыки, командной строкой Run и геометрическим рендерингом в реальном времени.

---

## 🚀 Как запустить проект на GitHub Pages? (Пошаговое руководство)

### 📌 Почему `index.html` в корне выглядит «пустым»?
В современных React-приложениях (Single Page Applications) корневой файл `index.html` содержит только тег `<div id="root"></div>` и ссылку на JavaScript-файл запуска `/src/main.tsx`. При открытии страницы браузер загружает этот пустой каркас, после чего **React динамически генерирует и отрисовывает весь интерфейс**.

При сборке в продакшн (команда `npm run build`) инструмент Vite читает этот файл, собирает весь JavaScript и CSS в оптимизированные файлы и помещает готовый работающий набор файлов в папку `dist/`. Именно **её содержимое**, включая сгенерированный рабочий `index.html`, нужно загружать на хостинг.

---

### 🛠 Способ 1. Автоматический деплой через GitHub Actions (Самый современный способ)

GitHub может собирать и выкладывать ваш проект автоматически при каждом изменении в репозитории.

1. Переименуйте репозиторий на GitHub в подходящее имя (например, `retro-portal`).
2. В вашем репозитории перейдите во вкладку **Settings** ➔ **Pages**.
3. В разделе **Build and deployment** под заголовком **Source** выберите **GitHub Actions**:
   
   ![Source Actions](https://img.shields.io/badge/Build_Source-GitHub_Actions-blue?style=flat-square)

4. Создайте в корне проекта файл `.github/workflows/deploy.yml` со следующим содержимым:

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches:
         - main  # или master, в зависимости от имени вашей ветки

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: true

   jobs:
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4

         - name: Set up Node
           uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm

         - name: Install dependencies
           run: npm ci

         - name: Build
           run: npm run build

         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: ./dist

         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

5. Сделайте push изменений в репозиторий. GitHub автоматически соберет проект и развернет его на вашем домене github.io!

---

### 📦 Способ 2. Деплой через пакет `gh-pages` (Вручную из терминала)

Если вы предпочитаете делать деплой командой из своей консоли:

1. Установите пакет `gh-pages` как dev-зависимость в вашем терминале:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Откройте `package.json` и добавьте новое свойство `homepage` на верхнем уровне (замените `your-username` и `retro-portal` на ваши данные):
   ```json
   "homepage": "https://your-username.github.io/retro-portal",
   ```
3. В раздел `"scripts"` в файле `package.json` добавьте две команды:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist",
     ...
   }
   ```
4. Запустите консольную команду деплоя:
   ```bash
   npm run deploy
   ```
   Пакет скомпилирует приложение в папку `dist` и автоматически отправит её ветку `gh-pages` вашего репозитория. GitHub Pages автоматически опубликует сайт в течение пары минут!

---

## 🎨 Особенности и Ключевой Функционал

### 🖥️ Windows XP Desktop Shell
* **Тема Geometric Balance:** Идеальный баланс графических форм с оригинальной XP-синей рамкой окон, узнаваемыми кнопками заголовков и плотными рамками утилит.
* **Интерфейс CRT мониторов:** Интерактивный лончер дисков с ретро-дисплеями, аналоговым свечением кинескопа и сканирующими полосами помех (CRT Scanlines toggle).

### 🕹️ Встроенные Классические Игры
* 🧱 **Cubic Blocks Arcade:** Динамичная головоломка с падающими цветными блоками.
* 💣 **Minesweeper Alpha:** Моделируемая сетка сапера со свободным выбором сложности, флагами и оригинальным генератором безопасного первого клика.
* 🎨 **Cubic Paint Pro:** Полный графический пиксельный редактор! Рисуйте шедевры, используйте заливку, ластик и палитры, а затем сохраняйте их прямо на Рабочий Стол в виде ярлыков-файлов!

### ⚙️ Дополнительные Системные Утилиты
* 🛠️ **Панель «Run»**: Поддерживает ввод системных команд (введите `matrix` для активации заставки, `winver` для вызова окна лицензии или `bliss` для сброса обоев).
* 🗑️ **Recycle Bin**: Корзина с очисткой кэша файлов.
* 🔊 **Nostalgic Sounds & Music**: Воспроизведение фоновых треков ранней игровой эпохи и олдскульные звуковые клики, ошибки и всплывающие подсказки.

---

## ⚙️ Локальной запуск и Разработка

Если вы хотите запустить проект локально на своем компьютере:

1. Установите зависимости проекта:
   ```bash
   npm install
   ```
2. Запустите сервер разработки локально:
   ```bash
   npm run dev
   ```
3. Сборка оптимизированного продакшн-бандла:
   ```bash
   npm run build
   ```

---

## 🛠 Технологический Стек

* **Фреймворк:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Сборщик:** [Vite 6.x](https://vitejs.dev/)
* **Стилизация:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Анимации:** [motion/react](https://github.com/motiondivision/motion)
* **Иконки:** [Lucide React](https://lucide.github.io/lucide-react/)

---
*Создано с любовью к золотой эре настольных операционных систем. cubic.games 2026.*
