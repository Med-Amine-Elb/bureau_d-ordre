# Architecture et Structure Complète des Données - Dashboard GBM

Ce document explique le processus global de développement et contient **absolument toute la structure de données** Dataverse (Tables, Relations, Flux, etc.) à utiliser comme référence pour le développement du projet.

---

## PARTIE 1 : COMPRENDRE LE PROCESSUS DU PROJET

Le projet est divisé en trois grandes parties qui interagissent ensemble :

1. **Le Frontend (Ce projet PCF React/Vite)** :
   C'est l'interface visuelle. 
   - **Mode Local (`npm run dev`)** : L'API `window.Xrm.WebApi` n'existe pas. On utilise des données "Mocks" (simulées) codées en dur dans React pour concevoir le design.
   - **Mode Production (Power Apps)** : Le code utilise `window.Xrm.WebApi` pour taper directement dans Dataverse.
2. **Le Backend (Dataverse)** :
   Héberge les tables définies ci-dessous. Gère la sécurité (RBAC). Le frontend lui envoie des requêtes de création/mise à jour (CRUD).
3. **La Logique Automatisée (Power Automate)** :
   Le code React ne gère pas les emails ni les intégrations externes. Il se contente de modifier des enregistrements dans Dataverse (ex: modifier le `new_statut`). Power Automate détecte cette modification dans Dataverse et exécute les workflows (emails, SharePoint, etc.).

---

## PARTIE 2 : STRUCTURE COMPLÈTE DES DONNÉES (DATAVERSE)

Voici l'intégralité des tables, champs, et énumérations nécessaires au projet.

### 2.1 Table Principale : `new_dossier`

| Champ | Type Dataverse | Obligatoire | Valeurs / Notes |
|---|---|---|---|
| `new_dossierid` | GUID (PK) | ✅ | Auto-généré |
| `new_numero_dossier` | Text (20) | ✅ | Auto: `DOS-{YYYY}-{SEQ}` |
| `new_type_document` | Choice | ✅ | Enum TypeDocument |
| `new_statut` | Choice | ✅ | Enum Statut |
| `new_date_reception` | Date Only | ✅ | Date réception physique BO |
| `new_date_creation` | DateTime | ✅ | Auto |
| `new_cree_par` | Lookup → SystemUser | ✅ | Utilisateur BO créateur |
| `new_fournisseur_id` | Lookup → new_fournisseur | ✅ | |
| `new_societe_gbm_id` | Lookup → new_societe_gbm | ✅ | |
| `new_direction_id` | Lookup → new_direction | ✅ | |
| `new_prescripteur_id` | Lookup → SystemUser | ❌ | Null si flux court |
| `new_collecteur_dcf_id` | Lookup → SystemUser | ❌ | Obligatoire si DemandeChèque/Acompte |
| `new_numero_facture` | Text (50) | ❌ | Unique |
| `new_date_facture` | Date Only | ❌ | |
| `new_montant` | Currency | ❌ | |
| `new_devise` | Choice | ❌ | Enum Devise |
| `new_description` | Memo (2000) | ❌ | |
| `new_est_bloque` | Boolean | ✅ | Default: false |
| `new_motif_blocage` | Text (500) | ❌ | |
| `new_dossier_lie_id` | Lookup → new_dossier | ❌ | Pour Avoir |
| `new_jours_ecoules` | Whole Number | — | Calculé: today - date_reception |
| `new_regle_5_jours` | Boolean | — | Calculé |
| `new_sharepoint_url` | URL (500) | ❌ | MAJ par Power Automate |
| `new_mode_paiement` | Choice | ❌ | Enum ModePaiement |
| `new_numero_cheque` | Text (30) | ❌ | |
| `new_reference_virement` | Text (50) | ❌ | |
| `new_agence_destination_id` | Lookup → new_agence | ❌ | Si Hors Casa |
| `new_numero_ecriture_comptable` | Text (50) | ❌ | Saisi par DCF |
| `new_date_comptabilisation` | Date Only | ❌ | |
| `new_date_preparation_cheque` | Date Only | ❌ | |
| `new_date_remise_finale` | Date Only | ❌ | |
| `new_flux_type` | Choice | ✅ | Standard / Court |

**Documents Complémentaires (Champs booléens sur `new_dossier`) :**
- `new_doc_bl` (Boolean)
- `new_doc_fiche_contrat` (Boolean)
- `new_doc_att_fiscale` (Boolean)
- `new_doc_bc` (Boolean)
- `new_doc_br` (Boolean)
- `new_doc_devis` (Boolean)

---

### 2.2 Tables Secondaires et Historiques

#### `new_transmission` (Historique des transmissions)
- `new_transmissionid` (GUID)
- `new_dossier_id` (Lookup → new_dossier)
- `new_de_role` (Choice: Enum Role)
- `new_vers_role` (Choice: Enum Role)
- `new_collecteur_id` (Lookup → SystemUser)
- `new_date_transmission` (DateTime)
- `new_date_accuse_reception` (DateTime)
- `new_accuse_par_id` (Lookup → SystemUser)
- `new_commentaire_emission` (Memo)
- `new_commentaire_reception` (Memo)
- `new_statut_transmission` (Choice: EnCours/Complété)

#### `new_relance` (Historique des relances)
- `new_relanceid` (GUID)
- `new_dossier_id` (Lookup → new_dossier)
- `new_type_relance` (Choice: Fournisseur/Prescripteur)
- `new_canal` (Choice: Email/Tel/Courrier)
- `new_date_relance` (DateTime)
- `new_destinataire_id` (Lookup → SystemUser)
- `new_contenu` (Memo)
- `new_resultat` (Choice: EnAttente/Répondu)
- `new_relance_par_id` (Lookup → SystemUser)

#### `new_blocage` (Historique des blocages)
- `new_blocageid` (GUID)
- `new_dossier_id` (Lookup → new_dossier)
- `new_date_blocage` (DateTime)
- `new_bloque_par_id` (Lookup → SystemUser)
- `new_motif` (Memo)
- `new_categorie` (Choice: Enum CategorieBlocage)
- `new_date_deblocage` (DateTime)
- `new_resolution` (Memo)
- `new_est_actif` (Boolean)

#### `new_fournisseur` (Référentiel)
- `new_fournisseurid` (GUID)
- `new_nom` (Text)
- `new_ice` (Text)
- `new_telephone` (Text)
- `new_email` (Email)
- `new_est_actif` (Boolean)
- `new_rib` (Text)

#### `new_document` (Fichiers scannés SharePoint)
- `new_documentid` (GUID)
- `new_dossier_id` (Lookup → new_dossier)
- `new_nom_fichier` (Text)
- `new_type_doc_scan` (Choice: Enum TypeDocScan)
- `new_sharepoint_url` (URL)
- `new_date_upload` (DateTime)

---

### 2.3 Énumérations (Choices)

Pour interagir avec Dataverse, utilisez toujours ces valeurs entières.

**`new_type_document` :**
- `100` : Facture
- `200` : Avoir
- `300` : Contrat
- `400` : DemandeChèque
- `500` : AcompteFacture

**`new_statut` :**
- `10` : Brouillon
- `20` : Rejeté 5 Jours
- `30` : En Transit Vers Prescripteur
- `40` : Chez Prescripteur
- `50` : En Transit Vers BO
- `60` : Complet Prêt DCF
- `70` : En Transit Vers DCF
- `80` : Chez DCF
- `90` : Retour Correction
- `100` : En Transit Vers Trésorerie
- `110` : Chez Trésorerie
- `120` : En Attente Remise Finale
- `130` : En Transport Vers Agence
- `140` : Disponible Agence
- `150` : Payé
- `160` : Payé-Avance

**`new_devise` :** `1` (MAD), `2` (EUR), `3` (USD)
**`new_mode_paiement` :** `1` (Chèque), `2` (Virement)
**`Role` :** `1` (BO), `2` (Prescripteur), `3` (DCF), `4` (Trésorerie), `5` (Agence), `6` (Admin)

---

## PARTIE 3 : LES COMPÉTENCES (SKILLS) À UTILISER DANS LE CODE

### Skill 1 : Le Modèle de Connexion Dataverse Simple

Modèle à utiliser systématiquement pour lister des données dans les pages :

```tsx
import { useEffect, useState } from "react"

export function ModeleList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Vérifier si on est dans Power Apps
      if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
        try {
          // Exemple: Récupérer dossiers Brouillon
          const result = await (window as any).Xrm.WebApi.retrieveMultipleRecords(
            "new_dossier", 
            "?$select=new_numero_dossier,new_statut&$filter=new_statut eq 10"
          );
          setData(result.entities);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        // 2. Mode Dev Local : Mocks Data
        setTimeout(() => {
          setData([
            { new_dossierid: "1", new_numero_dossier: "DOS-001", new_statut: 10 }
          ]);
          setLoading(false);
        }, 800);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Chargement...</div>;
  return <div>{data.length} résultats</div>;
}
```

### Skill 2 : Le Modèle de Mise à Jour Dataverse (Déclenchement Flow)

Modèle à utiliser lors du clic sur un bouton d'action (Ex: "Transmettre au Prescripteur").

```tsx
const updateDossierStatut = async (dossierId: string, nouveauStatut: number, prescripteurId?: string) => {
  if (typeof window !== "undefined" && (window as any).Xrm && (window as any).Xrm.WebApi) {
    try {
      const dataToUpdate: any = {
        new_statut: nouveauStatut // Ex: 30 (En Transit Vers Prescripteur)
      };
      
      // Si on doit lier un utilisateur (Lookup)
      if (prescripteurId) {
        dataToUpdate["new_prescripteur_id@odata.bind"] = `/systemusers(${prescripteurId})`;
      }

      await (window as any).Xrm.WebApi.updateRecord("new_dossier", dossierId, dataToUpdate);
      alert("Dossier mis à jour ! Le flux Power Automate va maintenant s'exécuter.");
    } catch (error) {
      console.error(error);
    }
  } else {
    // En local, on fait juste un console.log
    console.log("Mock Update : Dossier", dossierId, "passe au statut", nouveauStatut);
    alert("Simulation: Dossier mis à jour !");
  }
}
```

---

## PARTIE 4 : RÔLES ET ROUTAGE DES DASHBOARDS UNIQUES

Le système comporte 6 rôles distincts. Chaque rôle possède son propre Dashboard avec des indicateurs et des tableaux spécifiques.

### 4.1 La structure de Navigation (React Router)

Dans le frontend, le routage (fichier `src/router.tsx`) doit refléter cette séparation. L'utilisateur sera redirigé vers son Dashboard spécifique après connexion.

```
/                -> Redirection automatique vers le bon dashboard
/bo/dashboard    -> Dashboard Bureau d'Ordre (Vue globale et création)
/prescripteur/dashboard -> Dashboard Prescripteur (Ses dossiers assignés)
/dcf/dashboard   -> Dashboard Comptabilité
/tresorerie/dashboard -> Dashboard Trésorerie
/agence/dashboard -> Dashboard Agence Régionale
/admin/dashboard -> Dashboard Administrateur (Statistiques globales)
```

### 4.2 Stratégie de Filtrage par Rôle (Skill 3)

La magie de l'architecture PCF / Dataverse est que **les requêtes Dataverse changent selon le rôle**. Vous ne récupérez pas "tous les dossiers", mais uniquement ceux qui concernent le rôle actif.

Voici les filtres Dataverse (OData) à utiliser pour chaque Dashboard :

**1. Dashboard BO (Bureau d'Ordre) :**
- Voit tout, mais filtre surtout par statut en cours.
- Filtre OData: `?$filter=new_statut ne 150` (Tous sauf Payé)

**2. Dashboard Prescripteur :**
- Ne voit **que** les dossiers qui lui sont assignés ET qui ont le statut `En Transit Vers Prescripteur` ou `Chez Prescripteur`.
- Filtre OData: `?$filter=_new_prescripteur_id_value eq 'GUID_USER' and (new_statut eq 30 or new_statut eq 40)`

**3. Dashboard DCF (Comptabilité) :**
- Voit uniquement les dossiers `En Transit Vers DCF` (70) ou `Chez DCF` (80).
- Filtre OData: `?$filter=new_statut eq 70 or new_statut eq 80`

**4. Dashboard Trésorerie :**
- Voit les dossiers prêts pour le règlement (100 et 110).
- Filtre OData: `?$filter=new_statut eq 100 or new_statut eq 110`

### 4.3 Comment connaître le rôle de l'utilisateur actuel ?

Dans Power Apps, on peut récupérer les informations de l'utilisateur connecté via :
```typescript
const currentUserId = (window as any).Xrm.Utility.getGlobalContext().userSettings.userId;
const userRoles = (window as any).Xrm.Utility.getGlobalContext().userSettings.securityRoles;
```
Cela permet d'appliquer la logique conditionnelle dans le code React et d'afficher le bon Layout/Dashboard.
