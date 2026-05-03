SPECIFICATIONS COMPLETES - DASHBOARD WEB BUREAU D'ORDRE GBM
Version 1.0 - Avril 2026
--------------------------------------------------------------
TABLE DES MATIÈRES
Architecture du Dashboard
Rôles et Permissions
Pages par Rôle (Détail Complet)
Flux de Suivi par Rôle
Composants UI/UX Requis
Intégrations Techniques
Tableaux de Bord et KPIs
Notifications et Alertes
Gestion des Documents
Règles Métier Frontend
================================================================================
1. ARCHITECTURE DU DASHBOARD
================================================================================
1.1 Structure Générale
Application Web Responsive (Desktop prioritaire, tablette compatible)
Authentification SSO (Azure AD / Entra ID)
Navigation latérale adaptative selon le rôle
Thème: Interface professionnelle, couleurs corporatives GBM
Langue: Français (arabe optionnel futur)
1.2 Layout de Base (Tous les Rôles)
Header: Logo GBM | Titre "Bureau d'Ordre - Gestion des Dossiers Fournisseurs" | Notifications | Profil utilisateur | Déconnexion
Sidebar Navigation: Menu dynamique selon le rôle
Main Content Area: Zone principale de contenu
Footer: Version app | Support IT | Mentions légales
Breadcrumb: Fil d'Ariane pour la navigation
1.3 États Globaux de l'Application
État: Chargement (skeleton screens)
État: Erreur (messages contextualisés)
État: Vide (illustrations + actions suggérées)
État: Succès (toasts de confirmation)
État: Confirmation (modales de validation)
================================================================================
2. RÔLES ET PERMISSIONS DÉTAILLÉS
================================================================================
2.1 Bureau d'Ordre (BO) - Chef d'orchestre
ID: ROLE_BO
Description: Gère l'intégralité du flux de traitement des dossiers
Visibilité: TOUS les dossiers à TOUTES les étapes
Permissions: CRUD complet sur tous les dossiers, gestion des relances, upload documents, remise chèques
2.2 Prescripteur
ID: ROLE_PRESCRIPTEUR
Description: Valide les factures et fournit le Bon de Réception
Visibilité: Uniquement ses dossiers ASSIGNÉS
Permissions: Lecture/Validation de ses dossiers, accusé réception, demande de correction
2.3 Comptabilité (DCF)
ID: ROLE_DCF
Description: Comptabilise les dossiers dans le système interne
Visibilité: Dossiers transmis à la DCF UNIQUEMENT
Permissions: Accusé réception, comptabilisation, retour correction, transmission Trésorerie
2.4 Trésorerie
ID: ROLE_TRESORERIE
Description: Prépare les règlements (chèques/virements)
Visibilité: Dossiers au statut "Prêt Trésorerie"
Permissions: Accusé réception, préparation règlement, remise chèque BO, signalement blocage
2.5 Agence Régionale
ID: ROLE_AGENCE
Description: Remet le chèque au fournisseur local
Visibilité: Chèques de SON AGENCE uniquement
Permissions: Accusé réception chèque, scan chèque, validation remise
2.6 Administrateur
ID: ROLE_ADMIN
Description: Supervise et configure le système
Visibilité: Accès TOTAL - tous les dossiers
Permissions: Gestion utilisateurs, configuration tables référence, rapports globaux, déblocage dossiers
================================================================================
3. PAGES PAR RÔLE - DÉTAIL COMPLET
================================================================================
═══════════════════════════════════════════════════════════════════════════════
RÔLE: BUREAU D'ORDRE (BO)
═══════════════════════════════════════════════════════════════════════════════
PAGE 1: TABLEAU DE BORD BO (Dashboard Principal)
URL: /bo/dashboard
Description: Vue d'ensemble de tous les dossiers en cours
Composants:
Cartes KPI (Top Row):
Dossiers en cours total
Dossiers en attente d'action BO
Dossiers en retard (>5 jours)
Dossiers bloqués
Chèques en attente de remise
Dossiers clôturés aujourd'hui
Graphique Circulaire: Répartition des dossiers par statut
Graphique Barres: Dossiers créés par semaine (4 dernières semaines)
Tableau Alertes: Dossiers nécessitant une action urgente (top 10)
Timeline Activité: Dernières actions sur les dossiers (flux temps réel)
Quick Actions Buttons:
[+ Nouveau Dossier]
[Relances Fournisseurs]
[Relances Prescripteurs]
[Chèques à Remettre]
Données affichées:
Nombre total de dossiers actifs
Répartition par type de document (Facture/Avoir/Contrat/DemandeChèque/Acompte)
Dossiers par statut avec compteurs
Alertes 5 jours dépassés
Dossiers en attente BR
Dossiers en transit vers Prescripteur/DCF/Trésorerie/Agence
Actions disponibles:
Créer un nouveau dossier
Accéder à la liste complète
Gérer les relances
Voir les statistiques
PAGE 2: LISTE DES DOSSIERS (Vue Complète)
URL: /bo/dossiers
Description: Liste exhaustive de tous les dossiers avec filtres avancés
Composants:
Barre de Filtres Avancés:
Recherche par N° Facture, Fournisseur, N° Dossier
Filtre par Statut (dropdown multi-sélection)
Filtre par Type Document (checkboxes)
Filtre par Date (création, réception, échéance)
Filtre par Prescripteur
Filtre par Direction
Filtre par Société GBM
Filtre par EstBloque (Oui/Non)
Bouton [Réinitialiser Filtres]
Bouton [Exporter Excel]
Tableau des Dossiers (Colonnes):
N° Dossier (cliquable → détail)
Type Document (avec badge couleur)
N° Facture
Fournisseur
Société GBM
Prescripteur
Statut (avec indicateur couleur)
Date Création
Date Réception
Jours écoulés
EstBloque (icône alerte si oui)
Actions (voir détail, éditer, historique)
Pagination: 25/50/100 résultats par page
Tri: Toutes les colonnes triables
Sélection multiple: Actions groupées possibles
Badges couleur par type:
Facture: Bleu
Avoir: Orange
Contrat: Vert
DemandeChèque: Violet
AcompteFacture: Rose
Badges couleur par statut:
Brouillon: Gris
Rejeté 5 Jours: Rouge foncé
En Attente BR: Jaune
En Transit: Bleu clair
Chez [Acteur]: Vert clair
Prêt/Disponible: Vert
Payé: Vert foncé
Bloqué: Rouge
Actions par ligne:
[Voir Détail] → Page détail
[Éditer] → Modal édition (selon statut)
[Historique] → Timeline complète
[Relancer] → Modal relance
[Bloquer] → Modal blocage
PAGE 3: CRÉATION NOUVEAU DOSSIER
URL: /bo/dossiers/nouveau
Description: Formulaire de création d'un nouveau dossier fournisseur
Sections du formulaire:
Section 1: Informations Générales
Date de réception (date picker, défaut aujourd'hui)
Fournisseur (autocomplete + création rapide si nouveau)
Société GBM concernée (dropdown)
Direction (dropdown)
Prescripteur assigné (dropdown des utilisateurs Prescripteur)
Section 2: Document Principal
Type Document Principal (radio buttons):
Facture
Avoir
Contrat
DemandeChèque
AcompteFacture
N° Facture (texte)
Date Facture (date picker)
Montant (nombre, validation format)
Devise (dropdown: MAD, EUR, USD)
Description/Objet (textarea)
Section 3: Documents Complémentaires (Multi-sélection)
[x] BL (Bon de Livraison)
[x] Attestation de service
[x] Attestation fiscale
[x] BC (Bon de Commande)
[x] BR (Bon de Réception)
[x] Contrat
Note: Certains documents masqués selon le type principal sélectionné
Note: Documents requis affichés avec astérisque rouge
Section 4: Documents Scannés (Upload)
Zone de drag & drop upload
Format: PDF uniquement
Taille max: 5MB par fichier
Liste des fichiers uploadés avec preview
Bouton [Ajouter un document]
Progress bar upload
Section 5: Informations Spécifiques (Conditionnel)
Si Avoir:
Dossier Lié (obligatoire) - recherche et sélection du dossier origine
Badge "AVOIR" affiché
Si Contrat:
BL masqué (non requis)
Badge "CONTRAT" affiché
Si DemandeChèque:
Collecteur DCF (OBLIGATOIRE - dropdown utilisateurs DCF)
Devis validé (upload obligatoire)
Badge "DEMANDE CHÈQUE" affiché
Statut initial: "En Transit Vers DCF"
Si AcompteFacture:
Collecteur DCF (OBLIGATOIRE)
Devis validé (upload obligatoire)
Badge "ACOMPTE" affiché
Statut initial: "En Transit Vers DCF"
Si Facture:
Règle 5 jours appliquée automatiquement
Badge "FACTURE" affiché
Statut initial: "En Transit Vers Prescripteur"
Section 6: Vérification et Validation
Récapitulatif des informations saisies
Validation des champs obligatoires
Calcul automatique: DateRéception - DateFacture > 5j ?
Si OUI: Alert "REJETÉ 5 JOURS" - statut auto = Rejeté 5 Jours
Si NON: Statut normal selon type
Bouton [Enregistrer en Brouillon]
Bouton [Soumettre le Dossier]
Bouton [Annuler]
Règles de validation frontend:
Tous les champs obligatoires doivent être remplis
N° Facture unique (vérification API)
Date Facture <= Date Réception
Upload PDF uniquement
Taille fichier <= 5MB
Si DemandeChèque/Acompte: CollecteurDCF obligatoire
Si Avoir: DossierLié obligatoire
PAGE 4: DÉTAIL DOSSIER (Vue Complète)
URL: /bo/dossiers/:id
Description: Vue détaillée d'un dossier spécifique avec toutes les informations
Layout: Onglets
Onglet 1: Informations Générales
Carte d'identité du dossier:
N° Dossier (en grand)
Type Document (badge)
Statut actuel (badge grand)
Date création
Créé par
Grille d'informations (2 colonnes):
Fournisseur (avec contact)
Société GBM
Direction
Prescripteur
Montant
N° Facture
Date Facture
Date Réception
Jours écoulés
EstBloque (Oui/Non + motif si oui)
Documents complémentaires (liste avec icônes check/uncheck)
Documents scannés (liste cliquable → preview PDF)
Lien SharePoint vers le dossier
Onglet 2: Flux de Traitement (Timeline)
Timeline verticale des étapes:
Chaque étape avec: Date, Acteur, Action, Commentaire
Étapes passées: vert avec check
Étape en cours: bleu avec animation pulse
Étapes futures: gris
Étapes rejetées/correction: rouge
Étapes affichées selon le type de flux:
Flux standard (9 étapes) ou Flux court (6 étapes)
Onglet 3: Transmissions
Tableau des transmissions:
De → Vers
Date transmission
Collecteur désigné
Date accusé réception
Statut transmission (En cours / Complété)
Durée de transmission
Onglet 4: Historique Blocages
Tableau des blocages:
Date blocage
Motif
Bloqué par
Date déblocage
Résolution
Débloqué par
Onglet 5: Historique Relances
Tableau des relances:
Date relance
Type (Fournisseur / Prescripteur)
Destinataire
Canal (Email/Téléphone/Courrier)
Contenu
Résultat
Onglet 6: Documents
Liste tous les documents scannés
Preview intégrée (PDF viewer)
Téléchargement individuel
Téléchargement ZIP complet
Upload document supplémentaire
Actions disponibles (selon statut):
[Transmettre à Prescripteur] → Modal: sélectionner collecteur
[Transmettre à DCF] → Modal: sélectionner collecteur DCF
[Relancer Fournisseur] → Modal relance
[Relancer Prescripteur] → Modal relance
[Bloquer Dossier] → Modal: motif + catégorie
[Débloquer Dossier] (si bloqué + admin)
[Retourner pour Correction] → Modal: motif
[Remettre Chèque] → Modal remise
[Éditer] (si Brouillon)
[Supprimer] (si Brouillon)
PAGE 5: TRANSMISSION DOSSIER (Modal/Étape)
URL: Modal depuis détail dossier
Description: Interface de transmission du dossier à un acteur
Contenu:
Acteur cible (affiché selon le flux)
Collecteur désigné (dropdown des utilisateurs du rôle cible)
Date de transmission (date picker, défaut aujourd'hui)
Commentaire (textarea optionnel)
Documents joints (liste des docs à transmettre)
Confirmation: Checkbox "J'ai physiquement transmis le dossier"
Règles:
Collecteur obligatoire avant transmission
Date transmission obligatoire
Confirmation physique obligatoire (checkbox)
Après soumission: statut change automatiquement
Notification auto envoyée au collecteur
PAGE 6: ACCUSÉ RÉCEPTION (Modal)
URL: Modal
Description: Interface pour accuser réception d'un dossier transmis
Contenu:
Informations transmission:
Transmis par
Date transmission
Collecteur désigné (vérification: est-ce l'utilisateur connecté?)
Date de réception (date picker, défaut aujourd'hui)
Commentaire (textarea)
Documents reçus (checklist)
Bouton [Accuser Réception]
Règles:
Seul le collecteur désigné (ou Admin) peut accuser réception
Date réception >= Date transmission
Après accusé: statut change automatiquement
PAGE 7: RELANCES
URL: /bo/relances
Description: Gestion centralisée des relances fournisseurs et prescripteurs
Composants:
Onglets: Relances Fournisseurs | Relances Prescripteurs
Relances Fournisseurs:
Tableau des dossiers en attente:
N° Dossier
Fournisseur (contact)
Statut
Jours d'attente
Dernière relance
Nombre de relances
Actions: [Relancer] [Voir Dossier]
Modal Nouvelle Relance:
Type: Email / Téléphone / Courrier
Date relance
Contenu (template sélectionnable)
Résultat (en attente / répondu / sans suite)
Pièce jointe
Relances Prescripteurs:
Tableau des dossiers en attente de validation:
N° Dossier
Prescripteur
Date transmission
Jours en attente
Nombre de relances
Actions: [Relancer] [Voir Dossier]
Templates de relance:
Relance standard fournisseur
Relance urgente (>10 jours)
Relance prescripteur standard
Relance prescripteur urgente
PAGE 8: REMISE CHÈQUE AU FOURNISSEUR
URL: /bo/remises
Description: Interface de gestion des remises de chèques
Composants:
Onglets: Chèques Casa | Chèques Hors Casa
Chèques Casa (Scénario A):
Tableau des chèques en attente de remise:
N° Dossier
Fournisseur
N° Chèque
Montant
Date préparation Trésorerie
Jours en attente
Actions: [Remettre Chèque]
Modal Remise Chèque:
Date remise effective (date picker)
Nom du fournisseur (pré-rempli, modifiable)
N° Chèque (pré-rempli)
Signature numérique / Checkbox "Cahier de Traçabilité signé"
Commentaire
Bouton [Confirmer Remise] → Statut = Payé
Chèques Hors Casa (Scénario B):
Tableau des chèques à expédier:
N° Dossier
Fournisseur
N° Chèque
Agence destination
Actions: [Expédier vers Agence]
Modal Expédition:
Agence destination (dropdown)
Date expédition
Mode d'envoi (courrier/transporteur)
N° suivi (optionnel)
Commentaire
Bouton [Confirmer Expédition] → Statut = En Transport Vers Agence
PAGE 9: GESTION DES BLOCAGES
URL: /bo/blocages
Description: Suivi et gestion des dossiers bloqués
Composants:
Tableau des dossiers bloqués:
N° Dossier
Fournisseur
Date blocage
Bloqué par
Motif
Catégorie
Jours de blocage
Actions: [Voir Dossier] [Débloquer]
Modal Déblocage:
Date déblocage
Résolution (textarea)
Documents complémentaires uploadés
Bouton [Confirmer Déblocage]
PAGE 10: UPLOAD DOCUMENTS SHAREPOINT
URL: Modal depuis détail dossier
Description: Interface d'upload des documents scannés
Composants:
Zone drag & drop
Sélection fichier classique
Preview avant upload
Barre de progression
Validation format (PDF) et taille (5MB)
Création automatique du dossier SharePoint: /sites/BO-GBM/Dossiers/{N°}_{Fournisseur}/
Mise à jour URL dans Dataverse après upload
═══════════════════════════════════════════════════════════════════════════════
RÔLE: PRESCRIPTEUR
═══════════════════════════════════════════════════════════════════════════════
PAGE 1: TABLEAU DE BORD PRESCRIPTEUR
URL: /prescripteur/dashboard
Description: Vue d'ensemble des dossiers assignés au prescripteur
Composants:
Cartes KPI:
Dossiers en attente de validation
Dossiers validés ce mois
Dossiers en attente BR
Dossiers en correction
Dossiers en retard
Tableau "À Traiter" (Prioritaire):
Dossiers au statut "Chez Prescripteur" (accusé réception fait)
Colonnes: N° Dossier, Fournisseur, Date réception, Jours écoulés, Montant, Actions
Tableau "En Attente d'Accusé":
Dossiers au statut "En Transit Vers Prescripteur"
Actions: [Accuser Réception]
Notifications: Alertes nouveaux dossiers assignés
Actions:
[Accuser Réception] → Modal accusé réception
[Valider] → Modal validation
[Demander Correction] → Modal correction
[Voir Détail] → Page détail
PAGE 2: LISTE DES DOSSIERS ASSIGNÉS
URL: /prescripteur/dossiers
Description: Liste des dossiers du prescripteur avec filtres
Composants:
Filtres: Statut, Date, Type Document, Fournisseur
Tableau:
N° Dossier
Type (badge)
Fournisseur
Statut
Date transmission BO
Date accusé réception
Jours en cours
Actions
Statuts visibles (uniquement ceux du prescripteur):
En Transit Vers Prescripteur
Chez Prescripteur
En Transit Vers BO (après validation)
Retour Correction (si le BO renvoie)
PAGE 3: DÉTAIL DOSSIER PRESCRIPTEUR
URL: /prescripteur/dossiers/:id
Description: Vue détaillée d'un dossier assigné
Onglets:
Onglet 1: Informations
Toutes les infos du dossier (lecture seule)
Documents scannés (visualisation)
Onglet 2: Validation
Section Validation Facture:
[Valider la Facture] → Confirme la validation
[Demander Correction] → Modal: motif détaillé
Upload BR (Bon de Réception) après validation
Onglet 3: Historique
Timeline des actions sur le dossier
Actions selon statut:
Si "En Transit Vers Prescripteur": [Accuser Réception]
Si "Chez Prescripteur": [Valider] ou [Demander Correction]
Si validation: Upload BR obligatoire
PAGE 4: ACCUSER RÉCEPTION (Modal)
URL: Modal
Description: Accuser réception d'un dossier transmis par le BO
Contenu:
Détails transmission (transmis par, date, documents)
Date réception (défaut aujourd'hui)
Commentaire
Checkbox confirmation
Bouton [Confirmer]
Règle:
Seul le collecteur désigné peut accuser réception
Après confirmation: statut = "Chez Prescripteur"
PAGE 5: VALIDATION FACTURE (Modal)
URL: Modal
Description: Valider ou demander correction sur une facture
Options:
Valider:
Checkbox "Facture validée"
Upload BR (obligatoire après validation)
Commentaire (optionnel)
Bouton [Confirmer Validation]
→ Statut: "En Transit Vers BO"
Demander Correction:
Motif (textarea obligatoire)
Catégorie (dropdown: Erreur montant / Erreur fournisseur / Document manquant / Autre)
Description détaillée
Bouton [Envoyer Demande Correction]
→ Notification BO, statut reste "Chez Prescripteur" ou retour BO
═══════════════════════════════════════════════════════════════════════════════
RÔLE: COMPTABILITÉ (DCF)
═══════════════════════════════════════════════════════════════════════════════
PAGE 1: TABLEAU DE BORD DCF
URL: /dcf/dashboard
Description: Vue d'ensemble des dossiers à traiter par la DCF
Composants:
Cartes KPI:
Dossiers en attente d'accusé réception
Dossiers à comptabiliser
Dossiers comptabilisés aujourd'hui
Dossiers retournés pour correction
Dossiers en transit vers Trésorerie
Tableau "À Accuser Réception":
Dossiers au statut "En Transit Vers DCF"
Actions: [Accuser Réception]
Tableau "À Comptabiliser":
Dossiers au statut "Chez DCF"
Colonnes: N° Dossier, Fournisseur, Date accusé réception, Jours en attente, Actions
Tableau "À Transmettre Trésorerie":
Dossiers comptabilisés en attente de transmission
PAGE 2: LISTE DES DOSSIERS DCF
URL: /dcf/dossiers
Description: Liste des dossiers visibles par la DCF
Filtres:
Statut: En Transit Vers DCF / Chez DCF / En Transit Retour BO / Retour Correction / Prêt Trésorerie
Type Document
Date
Fournisseur
Tableau:
N° Dossier
Type (badge)
Fournisseur
Statut
Date transmission BO
Date accusé réception DCF
Collecteur DCF
Jours en cours
Actions
PAGE 3: DÉTAIL DOSSIER DCF
URL: /dcf/dossiers/:id
Description: Détail et traitement d'un dossier
Onglets:
Onglet 1: Informations
Lecture seule des informations du dossier
Documents scannés (visualisation)
Documents requis (checklist)
Onglet 2: Comptabilisation
Section active uniquement si statut = "Chez DCF"
Date de traitement comptable (date picker)
Numéro d'écriture comptable (texte)
Commentaire comptable
[Confirmer Comptabilisation]
Onglet 3: Transmission Trésorerie
Section active après comptabilisation
Collecteur Trésorerie (dropdown OBLIGATOIRE)
Date remise Trésorerie (date picker)
Commentaire
Documents à transmettre
[Confirmer Transmission] → Statut: "En Transit vers Trésorerie"
Onglet 4: Retour Correction
Section alternative si erreur détectée
Catégorie erreur (dropdown)
Description détaillée (textarea)
Documents manquants (checklist)
[Retourner pour Correction] → Statut: "Retour Correction"
PAGE 4: ACCUSER RÉCEPTION DCF (Modal)
URL: Modal
Description: Accuser réception d'un dossier transmis par le BO
Contenu:
Détails transmission
Date réception
Commentaire
Vérification documents reçus
[Confirmer] → Statut: "Chez DCF"
═══════════════════════════════════════════════════════════════════════════════
RÔLE: TRÉSORERIE
═══════════════════════════════════════════════════════════════════════════════
PAGE 1: TABLEAU DE BORD TRÉSORERIE
URL: /tresorerie/dashboard
Description: Vue d'ensemble des dossiers à régler
Composants:
Cartes KPI:
Dossiers en attente d'accusé réception
Dossiers à préparer
Chèques préparés aujourd'hui
Virements effectués aujourd'hui
Dossiers bloqués
Montant total à régler
Tableau "À Accuser Réception":
Statut "En Transit vers Trésorerie"
Actions: [Accuser Réception]
Tableau "À Préparer":
Statut "Chez Trésorerie"
Colonnes: N° Dossier, Fournisseur, Montant, Mode paiement prévu, Jours attente
Tableau "En Attente Remise":
Statut "En Attente Remise Finale"
Chèques prêts à remettre au BO
PAGE 2: LISTE DES DOSSIERS TRÉSORERIE
URL: /tresorerie/dossiers
Description: Liste des dossiers visibles par la Trésorerie
Filtres:
Statut: En Transit vers Trésorerie / Chez Trésorerie / En Attente Remise Finale
Mode Paiement: Chèque / Virement
Date
Montant (range)
Tableau:
N° Dossier
Fournisseur
Montant
Mode Paiement
Statut
Date accusé réception
Jours en cours
Actions
PAGE 3: DÉTAIL DOSSIER TRÉSORERIE
URL: /tresorerie/dossiers/:id
Description: Détail et préparation du règlement
Onglets:
Onglet 1: Informations
Lecture seule
Documents (visualisation)
Onglet 2: Préparation Règlement
Section active si statut = "Chez Trésorerie"
Mode de paiement (radio):
Chèque
Virement
Si Chèque:
N° Chèque (texte)
Date préparation chèque
Banque émettrice
Si Virement:
Référence virement
Date virement
Compte bancaire destination
Date transmission BO (date picker)
Commentaire
[Confirmer Préparation] → Statut: "En Attente Remise Finale"
Onglet 3: Blocage
[Signaler Blocage] → Modal:
Source (dropdown: Fournisseur / Document / Système / Autre)
Motif (textarea)
[Confirmer Blocage] → Statut: Bloqué + Notification BO/Admin
Après résolution: [Débloquer] avec date et résolution
PAGE 4: ACCUSER RÉCEPTION TRÉSORERIE (Modal)
URL: Modal
Description: Accuser réception d'un dossier transmis par la DCF
Contenu:
Détails transmission
Date réception
Vérification documents
[Confirmer] → Statut: "Chez Trésorerie"
═══════════════════════════════════════════════════════════════════════════════
RÔLE: AGENCE RÉGIONALE
═══════════════════════════════════════════════════════════════════════════════
PAGE 1: TABLEAU DE BORD AGENCE
URL: /agence/dashboard
Description: Vue des chèques destinés à l'agence
Composants:
Cartes KPI:
Chèques en transit vers agence
Chèques reçus en attente de remise
Chèques remis aujourd'hui
Fournisseurs à contacter
Tableau "Chèques en Transit":
Statut "En Transport Vers Agence"
N° Dossier, Fournisseur, Date expédition, Actions: [Accuser Réception]
Tableau "Chèques à Remettre":
Statut "Disponible A Agence"
N° Dossier, Fournisseur, Date réception, Actions: [Valider Remise]
PAGE 2: LISTE CHÈQUES AGENCE
URL: /agence/cheques
Description: Liste des chèques visibles par l'agence
Filtres:
Statut: En Transport Vers Agence / Disponible A Agence / Payé
Date
Fournisseur
Tableau:
N° Dossier
Fournisseur
N° Chèque
Montant
Statut
Date expédition BO
Date réception agence
Actions
PAGE 3: ACCUSER RÉCEPTION CHÈQUE (Modal)
URL: Modal
Description: Accuser réception d'un chèque envoyé par le BO
Contenu:
Détails expédition
Date réception (défaut aujourd'hui)
Commentaire
[Confirmer] → Statut: "Disponible A Agence"
PAGE 4: VALIDER REMISE CHÈQUE (Modal)
URL: Modal
Description: Valider la remise du chèque au fournisseur
Contenu:
Détails chèque
Date remise effective
Nom fournisseur (confirmation)
Scan chèque avec date de reçu (upload obligatoire)
Checkbox "Fournisseur a signé le reçu"
Commentaire
[Confirmer Remise] → Statut: "Payé" (clôture automatique)
═══════════════════════════════════════════════════════════════════════════════
RÔLE: ADMINISTRATEUR
═══════════════════════════════════════════════════════════════════════════════
PAGE 1: TABLEAU DE BORD ADMIN
URL: /admin/dashboard
Description: Vue globale de supervision
Composants:
Cartes KPI Globaux:
Total dossiers en cours
Total dossiers ce mois
Dossiers bloqués (tous)
Dossiers rejetés 5 jours
Utilisateurs actifs
Temps moyen de traitement
Graphiques:
Répartition dossiers par statut (camembert)
Évolution mensuelle (courbe)
Top 5 fournisseurs par volume
Top 5 prescripteurs par délai
Délai moyen par étape
Alertes Admin:
Dossiers bloqués > 7 jours
Dossiers sans activité > 15 jours
Erreurs système
Flux Power Automate en échec
PAGE 2: GESTION DES UTILISATEURS
URL: /admin/utilisateurs
Description: CRUD utilisateurs et assignation rôles
Composants:
Tableau utilisateurs:
Nom complet
Email
Rôle (badge)
Agence (si applicable)
Statut (Actif/Inactif)
Dernière connexion
Actions: [Éditer] [Désactiver] [Réinitialiser MDP]
Modal Ajouter/Éditer:
Informations personnelles
Rôle (dropdown)
Agence (si rôle Agence)
Permissions spécifiques
Statut
PAGE 3: TABLES DE RÉFÉRENCE
URL: /admin/references
Description: Configuration des données de référence
Tables:
Fournisseurs: Liste, ajout, édition, désactivation
Agences: Liste, ajout, édition
Sociétés GBM: Liste, configuration
Directions: Liste, configuration
Catégories d'erreur DCF: Configuration
Motifs de blocage: Configuration
Templates de relance: Édition
PAGE 4: RAPPORTS ET STATISTIQUES
URL: /admin/rapports
Description: Rapports globaux et analytiques
Rapports disponibles:
Rapport activité mensuelle
Rapport délais de traitement
Rapport dossiers par acteur
Rapport erreurs et corrections
Rapport relances
Rapport chèques remis
Options:
Filtres date (période personnalisable)
Export PDF/Excel
Graphiques interactifs
Impression
PAGE 5: SUPERVISION DOSSIERS
URL: /admin/dossiers
Description: Vue complète de tous les dossiers (similaire BO mais avec plus de pouvoirs)
Actions supplémentaires Admin:
[Modifier Collecteur] (changer le collecteur désigné)
[Forcer Statut] (en cas d'erreur système)
[Débloquer] (dossiers bloqués)
[Supprimer] (dossiers problématiques)
[Fusionner Dossiers]
PAGE 6: CONFIGURATION SYSTÈME
URL: /admin/configuration
Description: Paramètres système
Paramètres:
Délai règle 5 jours (modifiable)
Seuil alerte relance (jours)
Configuration emails notifications
Configuration Teams
Seuils KPI (couleurs)
Logs système
Sauvegardes
================================================================================
4. FLUX DE SUIVI PAR RÔLE - ÉTAPES DÉTAILLÉES
================================================================================
FLUX STANDARD (Facture / Avoir / Contrat) - 9 ÉTAPES
═══════════════════════════════════════════════════════════════════════════════
ÉTAPE 1: Réception Fournisseur (PHYSIQUE - hors app)
Fournisseur se présente physiquement au BO
Dépôt des documents
ÉTAPE 2: Enregistrement BO
Page: /bo/dossiers/nouveau
Acteur: BO
Actions:
Créer nouveau dossier
Sélectionner/Créer fournisseur
Remplir: N° Facture, Fournisseur, Société GBM, N° BC, Direction, Prescripteur
Sélectionner Document Principal
Sélectionner Documents Complémentaires
Uploader documents scannés
Vérification règle 5 jours (auto)
Enregistrer
Statut résultant:
Si >5 jours: "Rejeté 5 Jours"
Sinon: "En Transit Vers Prescripteur"
Notification: Flow 1 - Notification Prescripteur
ÉTAPE 3: Transmission BO → Prescripteur
Page: Modal Transmission depuis détail
Acteur: BO
Actions:
Ouvrir dossier
Cliquer [Transmettre à Prescripteur]
Sélectionner Collecteur (Prescripteur)
Saisir date transmission
Confirmer transmission physique
Soumettre
Statut: "En Transit Vers Prescripteur"
Notification: Flow 1 - Email + Teams au Prescripteur
ÉTAPE 4: Accusé Réception + Validation Prescripteur
Page: /prescripteur/dashboard → Modal Accusé Réception
Acteur: Prescripteur (collecteur désigné)
Actions:
Recevoir notification
Accuser réception dans l'app
Vérifier facture
Valider OU Demander correction
Si validation: Fournir BR au BO
Statut après accusé: "Chez Prescripteur"
Statut après validation: "En Transit Vers BO"
ÉTAPE 5: Dossier Complet → DCF
Page: /bo/dossiers/:id → Modal Transmission
Acteur: BO
Actions:
Recevoir BR du Prescripteur
Composer dossier complet
Transmettre à DCF
Sélectionner Collecteur DCF
Confirmer transmission
Statut: "En Transit Vers DCF"
Notification: Flow 2 - Notification DCF
ÉTAPE 6: Comptabilisation DCF
Page: /dcf/dossiers/:id
Acteur: DCF (collecteur désigné)
Actions:
Accuser réception
Comptabiliser dans système interne
Saisir date traitement, date remise Trésorerie
Sélectionner Collecteur Trésorerie
Transmettre à Trésorerie
Statut après accusé: "Chez DCF"
Statut après comptabilisation: "En Transit vers Trésorerie"
Notification: Flow 3 - Notification Trésorerie
ÉTAPE 7: Préparation Règlement Trésorerie
Page: /tresorerie/dossiers/:id
Acteur: Trésorerie
Actions:
Accuser réception
Vérifier dossier
Préparer chèque OU virement
Saisir: mode paiement, N° chèque/réf virement, dates
Remettre chèque physiquement au BO
Statut après accusé: "Chez Trésorerie"
Statut après préparation: "En Attente Remise Finale"
ÉTAPE 8: Réception Chèque BO
Page: Modal Accusé Réception
Acteur: BO
Actions:
Recevoir chèque de Trésorerie
Accuser réception dans l'app
Statut: "En Attente Remise Finale"
ÉTAPE 9: Remise Chèque Fournisseur
Page: /bo/remises
Acteur: BO (Casa) OU Agence (Hors Casa)
Scénario A (Casa):
Fournisseur se présente au guichet BO
Signer Cahier de Traçabilité papier
BO remet chèque en main propre
BO saisit: date remise, nom fournisseur, N° chèque
Dossier clôture
Scénario B (Hors Casa):
BO saisit: agence destination, date expédition
Agence accuse réception
Fournisseur se présente à l'agence
Agence scan chèque avec date reçu
Agence valide remise
Dossier clôture
Statut final: "Payé"
Notification: Flow 8 - Clôture + Email fournisseur
FLUX COURT (DemandeChèque / AcompteFacture) - 6 ÉTAPES
═══════════════════════════════════════════════════════════════════════════════
ÉTAPE 1: Réception (PHYSIQUE)
ÉTAPE 2: Enregistrement BO (Phase 1)
Différences:
Collecteur DCF OBLIGATOIRE dès la création
Documents: Demande/Acompte + Devis validé
BC/BR/BL/AttFiscale NON requis en Phase 1
Statut initial: "En Transit Vers DCF"
Badge spécifique affiché
ÉTAPE 3: Transmission directe BO → DCF
Pas de passage par Prescripteur
Flux court
ÉTAPE 4: Comptabilisation DCF → Transmission Trésorerie
Identique flux standard
ÉTAPE 5: Préparation Trésorerie → Remise BO
Identique flux standard
ÉTAPE 6: Remise Fournisseur
Identique flux standard
Statut final: "Payé-Avance"
Bouton [+ Créer dossier solde] apparaît
PHASE 2 (après réception facture finale)
Création nouveau dossier lié au Phase 1
Documents complets requis (BL/AttSvc + AttFiscale + BC + BR)
Flux standard complet
À la clôture Phase 2: dossier Phase 1 marqué "Clôturé-AvanceRéglée"
================================================================================
5. COMPOSANTS UI/UX REQUIS
================================================================================
5.1 Composants Généraux
Header: Logo, titre, notifications (cloche avec badge), profil, déconnexion
Sidebar: Menu accordéon, icônes, badges de compteur, collapse/expand
Breadcrumb: Navigation hiérarchique
Footer: Version, support, liens
5.2 Composants de Données
Data Table: Tri, filtre, pagination, sélection, actions groupées
Cards KPI: Icône, valeur, label, variation, couleur
Timeline: Verticale, étapes, dates, acteurs, statuts
Badges: Type document (5 couleurs), Statut (10+ couleurs)
Progress Bars: Upload, traitement, avancement
Charts: Camembert, barres, lignes (Chart.js ou Recharts)
5.3 Composants de Formulaire
Input Text: Avec validation, icône, clear
Date Picker: Format FR, validation
Dropdown: Recherche, multi-sélection
Autocomplete: Fournisseurs, utilisateurs
File Upload: Drag & drop, preview, validation PDF/5MB
Radio/Checkbox: Styled, groupés
Textarea: Avec compteur caractères
Modal: Overlay, focus trap, animation
Wizard: Étapes création dossier
5.4 Composants de Feedback
Toast: Succès, erreur, warning, info (position top-right)
Alert: Inline, dismissible
Skeleton: Loading states
Empty State: Illustration + action suggérée
Confirm Dialog: Validation actions critiques
Tooltip: Info bulles
5.5 Composants Spécifiques
Document Viewer: PDF intégré
Status Indicator: Point coloré + label
User Avatar: Initiales + couleur
Notification Center: Liste, marquer lu, supprimer
Search Bar: Globale, avec filtres rapides
Filter Panel: Latéral, multi-critères
Export Button: Excel/PDF
================================================================================
6. INTÉGRATIONS TECHNIQUES
================================================================================
6.1 Backend / API
Dataverse: Tables new_dossier, new_transmission_dcf, new_blocage, new_relance
API REST: CRUD dossiers, filtrage, pagination
Authentification: Azure AD OAuth 2.0
Autorisation: JWT tokens avec rôles
6.2 SharePoint
Upload: API Graph / REST SharePoint
Création dossier: Automatique à la création dossier (Flow 7)
Lecture: URL dans Dataverse, preview via iframe/viewer
Structure: /sites/BO-GBM/Dossiers/{N°}_{Fournisseur}/
6.3 Power Automate (Flows)
Flow 1: Notification Prescripteur (Email + Teams)
Flow 2: Notification DCF (Email + Teams)
Flow 3: Notification Trésorerie (Email + Teams)
Flow 4: Notification Agence (Email)
Flow 5: Alerte Blocage (Email urgent BO + Admin)
Flow 6: Rejet 5 Jours (Email BO + instructions)
Flow 7: Création dossier SharePoint + MAJ URL
Flow 8: Clôture dossier (Archivage + notif BO + email fournisseur)
6.4 Notifications In-App
WebSocket / Polling: Temps réel
Types: Nouveau dossier, Accusé réception, Blocage, Relance
Stockage: Table new_notification
Marquage: Lu/Non lu
================================================================================
7. TABLEAUX DE BORD ET KPIs
================================================================================
7.1 KPIs Globaux (Admin)
Nombre total dossiers actifs
Nombre dossiers créés ce mois
Nombre dossiers clôturés ce mois
Temps moyen de traitement (création → paiement)
Nombre dossiers bloqués
Nombre dossiers rejetés 5 jours
Nombre relances envoyées
Montant total en cours de traitement
Délai moyen par étape
Taux de correction DCF
7.2 KPIs par Rôle
BO:
Dossiers en attente action BO
Dossiers en retard
Chèques en attente remise
Relances en cours
Prescripteur:
Dossiers à valider
Délai moyen validation
Taux de correction
DCF:
Dossiers à comptabiliser
Temps moyen comptabilisation
Taux retour correction
Trésorerie:
Dossiers à régler
Montant total à régler
Chèques préparés
Agence:
Chèques en transit
Chèques à remettre
Délai moyen remise
7.3 Graphiques Requis
Répartition par statut (camembert)
Évolution temporelle (courbe)
Répartition par type document (barres)
Top fournisseurs (barres horizontales)
Heatmap activité (calendrier)
Gauge délais
================================================================================
8. NOTIFICATIONS ET ALERTES
================================================================================
8.1 Types de Notifications
Info: Nouveau dossier assigné, Accusé réception confirmé
Warning: Dossier en attente > 3 jours, Relance nécessaire
Error: Blocage, Rejet 5 jours, Erreur système
Success: Dossier validé, Paiement effectué, Clôture
8.2 Canaux
In-App: Centre de notifications, badge, toast
Email: Notifications standard, récapitulatifs
Teams: Messages directs, mentions
SMS: Urgent uniquement (configurable)
8.3 Règles d'Envoi
Notification immédiate pour actions requises
Digest quotidien pour récapitulatifs
Alerte immédiate pour blocages
Email fournisseur uniquement à la clôture
================================================================================
9. GESTION DES DOCUMENTS
================================================================================
9.1 Types de Documents
Document Principal (1 par dossier):
Facture
Avoir
Contrat
DemandeChèque
AcompteFacture
Documents Complémentaires (0-N):
BL (Bon de Livraison)
Attestation de service
Attestation fiscale
BC (Bon de Commande)
BR (Bon de Réception)
Contrat (si type principal = Contrat)
9.2 Stockage SharePoint
Format: PDF uniquement
Taille: 5MB max par fichier
Structure: /sites/BO-GBM/Dossiers/{N°Dossier}_{Fournisseur}/
Création: Automatique (Flow 7)
Accès: Lecture pour tous les acteurs autorisés
9.3 Interface Upload
Drag & drop zone
Sélection classique
Preview avant validation
Barre de progression
Validation format/taille
Liste des fichiers avec suppression
9.4 Interface Visualisation
Liste des documents
Preview PDF intégrée
Téléchargement individuel
Téléchargement ZIP
Lien direct SharePoint
================================================================================
10. RÈGLES MÉTIER FRONTEND
================================================================================
10.1 Règles de Validation
N° Facture unique (vérification API)
Date Facture <= Date Réception
Date Réception - Date Facture <= 5 jours (sinon rejet auto)
Upload PDF uniquement
Taille fichier <= 5MB
Champs obligatoires selon type document
CollecteurDCF obligatoire pour DemandeChèque/Acompte
DossierLié obligatoire pour Avoir
BR obligatoire après validation Prescripteur
10.2 Règles d'Affichage
Documents complémentaires masqués selon type principal
Badges type document toujours visibles
Statut affiché avec couleur spécifique
Actions masquées selon statut et rôle
Champs en lecture seule selon rôle
Timeline adaptée au type de flux
10.3 Règles de Sécurité
Authentification obligatoire
Autorisation par rôle (RBAC)
Filtrage données côté serveur
Vérification collecteur pour accusé réception
Audit trail toutes les actions
Timeout session
CSRF protection
10.4 Règles de Routage
Redirection selon rôle après login
Accès interdit aux pages non autorisées
404 pour ressources inaccessibles
Maintenance page si indisponible
================================================================================
ANNEXE: MATRICE DES PAGES PAR RÔLE
================================================================================
Table
Page	BO	Prescripteur	DCF	Trésorerie	Agence	Admin
Dashboard	✅	✅	✅	✅	✅	✅
Liste Dossiers (tous)	✅	❌	❌	❌	❌	✅
Liste Dossiers (assignés)	❌	✅	✅	✅	❌	✅
Créer Dossier	✅	❌	❌	❌	❌	❌
Détail Dossier	✅	✅	✅	✅	❌	✅
Transmission	✅	❌	✅	❌	❌	✅
Accusé Réception	✅	✅	✅	✅	✅	✅
Validation	❌	✅	❌	❌	❌	❌
Comptabilisation	❌	❌	✅	❌	❌	❌
Préparation Règlement	❌	❌	❌	✅	❌	❌
Relances	✅	❌	❌	❌	❌	❌
Remise Chèque	✅	❌	❌	❌	✅	❌
Blocages	✅	❌	❌	❌	❌	✅
Upload Documents	✅	❌	❌	❌	❌	✅
Gestion Utilisateurs	❌	❌	❌	❌	❌	✅
Tables Référence	❌	❌	❌	❌	❌	✅
Rapports	❌	❌	❌	❌	❌	✅
Configuration	❌	❌	❌	❌	❌	✅
================================================================================
ANNEXE: STATUTS ET TRANSITIONS
================================================================================
Table
Statut	Acteur	Action Suivante	Statut Suivant
Brouillon	BO	Soumettre	En Transit Vers Prescripteur/DCF
Rejeté 5 Jours	Système	Aucune (final)	-
En Attente BR	BO	Réception BR	Complet Prêt DCF
En Transit Vers Prescripteur	BO	Accusé réception	Chez Prescripteur
Chez Prescripteur	Prescripteur	Valider	En Transit Vers BO
Chez Prescripteur	Prescripteur	Demander correction	Retour Correction
En Transit Vers BO	Prescripteur	Accusé réception BO	Complet Prêt DCF
Complet Prêt DCF	BO	Transmettre DCF	En Transit Vers DCF
En Transit Vers DCF	BO	Accusé réception DCF	Chez DCF
Chez DCF	DCF	Comptabiliser	En Transit vers Trésorerie
Chez DCF	DCF	Retourner erreur	Retour Correction
En Transit Retour BO	DCF	Accusé réception BO	Retour Correction
Retour Correction	BO	Corriger et retransmettre	En Transit Vers DCF
Prêt Trésorerie	BO	Enregistrer retour DCF	En Transit vers Trésorerie
En Transit vers Trésorerie	DCF	Accusé réception Trésorerie	Chez Trésorerie
Chez Trésorerie	Trésorerie	Préparer règlement	En Attente Remise Finale
En Attente Remise Finale	BO/Agence	Remettre chèque	Payé
En Transport Vers Agence	BO	Accusé réception agence	Disponible A Agence
Disponible A Agence	Agence	Valider remise	Payé
Payé	Système	-	Final (archivé)
================================================================================
ANNEXE: TABLEAU DES DOCUMENTS REQUIS PAR TYPE
================================================================================
Table
Type Document	BL/AttSvc	AttFiscale	BC	BR	Contrat	Devis	DossierLié	Règle 5j
Facture	Oui	Oui	Oui	Oui	Non	Non	Non	Oui
Contrat	Non	Oui	Oui	Oui	Oui	Non	Non	Oui
Avoir	Non	Non	Non	Non	Non	Non	Optionnel	Non
DemandeChèque P1	Non	Non	Non	Non	Non	Oui	Non	Non
DemandeChèque P2	Oui	Oui	Oui	Oui	Non	Non	Oui	Oui
AcompteFacture P1	Non	Non	Non	Non	Non	Oui	Non	Non
AcompteFacture P2	Oui	Oui	Oui	Oui	Non	Non	Oui	Oui
================================================================================ FIN DU DOCUMENT DE SPECIFICATIONS