# Power Apps Template - starter

An opinionated **Vite + TypeScript + React** starter template for building Power Apps code apps.

Designed for common app scenarios, easy extensibility, and minimal setup.

---

## Highlights
- **Modern tooling** - Vite, TypeScript, and React
- **Out-of-box styling** - Tailwind, shadcn/ui components, and theming out of the box
- **Batteries included** - Curated libraries pre-wired for common scenarios
- **Standard patterns** - Industry standard patterns and practices
- **Agent friendly** - Optimized for use with coding agents

## Liens des notifications

Les notifications de transmission contiennent un lien direct vers le dossier. En exécution dans Power Apps, l’application utilise automatiquement son URL courante. Pour les notifications créées depuis le serveur local (`http://localhost:3000`), renseignez l’URL de lecture (Play) de l’application publiée dans `.env.local` :

```env
VITE_POWER_APPS_APP_URL=https://apps.powerapps.com/play/...
```

Vous pouvez partir de `.env.example`. Redémarrez ensuite le serveur Vite. Le lien du dossier sera ajouté à cette URL, par exemple `https://apps.powerapps.com/play/...#/ouvrir-dossier/<identifiant>`.
---

## Pre-installed libraries
- [Tailwind CSS](https://tailwindcss.com/) - utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - pre-installed UI components
- [React Router](https://reactrouter.com/) - pages, routing
- [Zustand](https://zustand.docs.pmnd.rs/) - state management
- [Tanstack Query](https://tanstack.com/query/latest) - data fetching, state management
- [Tanstack Table](https://tanstack.com/table/latest) - interactive tables, datagrids
- [Lucide](https://lucide.dev/) - icons
  
