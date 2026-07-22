# Structure des Tables — Bureau d'Ordre GBM

## Contexte général

L'application **Bureau d'Ordre GBM** est une solution de suivi du flux documentaire développée sur **Microsoft Dataverse (Power Apps)**. Elle permet de tracer le cycle de vie des dossiers (factures, avoirs, acomptes, courriers) depuis leur réception physique au guichet du Bureau d'Ordre jusqu'à leur paiement final, en passant par les étapes de validation interne (Prescripteur, DCF, Trésorerie, Agence).

L'application est structurée autour de **10 tables custom** organisées en 3 couches :
- **Tables de référence** — données stables utilisées comme référentiels
- **Table principale** — le dossier, cœur du système
- **Tables historiques** — traçabilité complète de chaque action sur un dossier

> **Convention de nommage :** tous les identifiants techniques (noms de tables, noms de colonnes) sont en anglais. Les libellés d'affichage et les valeurs de choix restent en français.

---

## Phase 2 — Tables de Référence

Ces tables ne dépendent d'aucune autre table custom. Elles sont créées en premier car les tables principales et historiques y font référence via des colonnes Lookup.

---

### Table 1 — `new_company` (Société GBM)

**Rôle :** Référentiel des sociétés du groupe GBM. Chaque dossier est rattaché à une société, ce qui permet de segmenter les données par entité juridique.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Clé primaire | `new_companyid` | GUID (PK) | ✅ Auto | Identifiant unique généré automatiquement |
| Nom | `new_name` | Texte (100) | ✅ | Raison sociale de la société |
| Code | `new_code` | Texte (10) | ✅ | Code court d'identification (ex: GBM-H) |
| Est Actif | `new_is_active` | Oui/Non | ✅ | Indique si la société est active. Défaut: Oui |

---

### Table 2 — `new_branch` (Agence)

**Rôle :** Référentiel des agences régionales du groupe. Utilisé pour router les dossiers vers la bonne agence et identifier les fournisseurs locaux.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Clé primaire | `new_branchid` | GUID (PK) | ✅ Auto | Identifiant unique |
| Nom | `new_name` | Texte (100) | ✅ | Nom de l'agence (ex: Agence Marrakech) |
| Code | `new_code` | Texte (10) | ✅ | Code court (ex: MRK) |
| Ville | `new_city` | Texte (100) | ✅ | Ville de l'agence |
| Responsable | `new_manager_id` | Lookup → SystemUser | ❌ | Responsable de l'agence |
| Utilisateur Agence | `new_branch_user_id` | Lookup → SystemUser | ❌ | Utilisateur applicatif de l'agence — permet le mapping user↔agence pour les notifications |
| Est Actif | `new_is_active` | Oui/Non | ✅ | Défaut: Oui |

---

### Table 3 — `new_department` (Direction)

**Rôle :** Référentiel des directions internes du groupe. Chaque dossier est lié à une direction prescriptrice, permettant d'identifier le service demandeur.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Clé primaire | `new_departmentid` | GUID (PK) | ✅ Auto | Identifiant unique |
| Nom | `new_name` | Texte (100) | ✅ | Intitulé de la direction (ex: Direction Financière) |
| Code | `new_code` | Texte (10) | ✅ | Code court |
| Société | `new_company_id` | Lookup → `new_company` | ❌ | Société à laquelle appartient la direction |
| Est Actif | `new_is_active` | Oui/Non | ✅ | Défaut: Oui |

---

### Table 4 — `new_supplier` (Fournisseur)

**Rôle :** Référentiel des fournisseurs. Chaque dossier est rattaché à un fournisseur. Les informations stockées ici servent à l'identification et à la communication (email de relance).

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Clé primaire | `new_supplierid` | GUID (PK) | ✅ Auto | Identifiant unique |
| Nom | `new_name` | Texte (200) | ✅ | Raison sociale du fournisseur |
| Identifiant Fiscal | `new_tax_id` | Texte (20) | ❌ | ICE (Identifiant Commun de l'Entreprise) — Clé Alternate pour unicité |
| Téléphone | `new_phone` | Téléphone (20) | ❌ | Numéro de contact |
| Email | `new_email` | Email (100) | ❌ | Utilisé par les flows pour notifier le fournisseur |
| Adresse | `new_address` | Mémo (500) | ❌ | Adresse postale |
| Ville | `new_city` | Texte (100) | ❌ | Ville du fournisseur |
| Agence | `new_branch_id` | Lookup → `new_branch` | ❌ | Agence locale de rattachement du fournisseur |
| Est Actif | `new_is_active` | Oui/Non | ✅ | Défaut: Oui |

---

## Phase 3 — Table Principale

---

### Table 5 — `new_folder` (Dossier)

**Rôle :** Table centrale de l'application. Chaque dossier représente un document physique (facture, avoir, acompte ou courrier) reçu au Bureau d'Ordre. C'est autour de cette table que s'articule tout le flux de traitement : réception, validation, comptabilisation, paiement.

#### Colonnes simples

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Numéro Dossier | `new_folder_number` | Texte (20) | ✅ | Numéro auto-généré (ex: DOS-2024-0001) — Clé Alternate |
| Type Document | `new_document_type` | Choix | ✅ | Facture, Avoir, Acompte, Courrier |
| Numéro Facture | `new_invoice_number` | Texte (100) | ❌ | Numéro de la facture fournisseur (requis si Type Document = Facture) |
| Date Facture | `new_invoice_date` | Date | ❌ | Date d'émission de la facture (requise si Type Document = Facture) |
| Numéro BC | `new_po_number` | Texte (100) | ❌ | Numéro du Bon de Commande lié |
| Statut | `new_status` | Choix | ✅ | Statut courant du dossier dans le circuit — audité |
| Type Flux | `new_flow_type` | Choix | ✅ | Standard ou Court |
| Date Réception | `new_reception_date` | Date | ✅ | Date de réception physique au guichet BO |
| Est Bloqué | `new_is_blocked` | Oui/Non | ✅ | Indique si le dossier est bloqué — audité. Défaut: Non |
| Date Comptabilisation | `new_accounting_date` | Date | ❌ | Horodatée automatiquement par le Flow quand le DCF clique "Comptabilisation effectuée" — sert de condition de déblocage vers la Trésorerie |
| Mode Paiement | `new_payment_method` | Choix | ❌ | Chèque ou Virement — renseigné par la Trésorerie |
| Numéro Chèque | `new_cheque_number` | Texte (30) | ❌ | Renseigné par la Trésorerie si paiement par chèque |
| Référence Virement | `new_wire_reference` | Texte (50) | ❌ | Renseigné par la Trésorerie si paiement par virement |
| Date Préparation Chèque | `new_cheque_preparation_date` | Date | ❌ | Date à laquelle le chèque a été préparé |
| Date Remise Finale | `new_final_delivery_date` | Date | ❌ | Date de remise finale au bénéficiaire |
| URL SharePoint | `new_sharepoint_url` | URL (500) | ❌ | Lien vers le dossier SharePoint (alimenté par Flow) |
| Phase Acompte | `new_advance_phase` | Choix | ❌ | Phase 1 ou Phase 2 — pour les dossiers de type Acompte |
| Motif Annulation | `new_cancellation_reason` | Mémo (500) | ❌ | Texte libre expliquant la raison d'annulation du dossier |
| Date Dernière Alerte | `new_last_alert_date` | DateTime | ❌ | Horodatage anti-spam pour le Flow de rappels automatiques |
| Description | `new_description` | Mémo (2000) | ❌ | Observations libres sur le dossier |
| Jours Écoulés | `new_days_elapsed` | Nombre entier (Formule) | — | `DateDiff(new_reception_date, UTCToday(), TimeUnit.Days)` — calculé automatiquement |

#### Colonnes Lookup

| Colonne | Nom technique | Cible | Obligatoire | Description |
|---|---|---|---|---|
| Fournisseur | `new_supplier_id` | → `new_supplier` | ✅ | Fournisseur émetteur du document |
| Société | `new_company_id` | → `new_company` | ✅ | Société GBM concernée |
| Direction | `new_department_id` | → `new_department` | ✅ | Direction prescriptrice |
| Prescripteur | `new_prescriber_id` | → SystemUser | ❌ | Utilisateur chargé de valider le dossier |
| Collecteur DCF | `new_dcf_collector_id` | → SystemUser | ❌ | Agent DCF assigné au dossier |
| Agence Destination | `new_destination_branch_id` | → `new_branch` | ❌ | Agence destinataire du paiement (hors Casablanca) |
| Dossier Lié | `new_linked_folder_id` | → `new_folder` | ❌ | Auto-référence — lie un Avoir à sa facture d'origine |

#### Liste des statuts (`new_status`)

| Code | Libellé | Description |
|---|---|---|
| 10 | Brouillon | Dossier en cours de création |
| 20 | Rejeté 5 Jours | Dossier rejeté car reçu plus de 5 jours après la date facture |
| 30 | En Transit Vers Prescripteur | BO a transmis le dossier au Prescripteur |
| 40 | Chez Prescripteur | Prescripteur a accusé réception |
| 50 | En Transit Vers BO | Prescripteur a validé et retransmet vers BO |
| 60 | Complet Prêt DCF | BO a vérifié la complétude, prêt pour DCF |
| 70 | En Transit Vers DCF | BO a transmis au DCF |
| 80 | Chez DCF | DCF a accusé réception |
| 90 | Retour Correction | DCF retourne le dossier pour correction |
| 100 | En Transit Vers Trésorerie | DCF a comptabilisé et transmis à la Trésorerie |
| 110 | Chez Trésorerie | Trésorerie a accusé réception |
| 120 | En Attente Remise Finale | Trésorerie a préparé le paiement |
| 130 | En Transport Vers Agence | Paiement en route vers l'agence |
| 140 | Disponible Agence | Paiement disponible à l'agence |
| 150 | Payé | Dossier clôturé — paiement effectué |
| 160 | Payé-Avance | Phase 1 d'un acompte réglée |
| 170 | Clôturé-AvanceRéglée | Acompte intégralement réglé |
| 200 | Annulé | État terminal — dossier annulé sans suppression physique |

---

## Phase 4 — Tables Historiques

Ces tables dépendent toutes de `new_folder`. La relation est configurée en **Referential, Restrict Delete** : un dossier ne peut pas être supprimé tant qu'il possède des enregistrements liés, garantissant ainsi l'intégrité et l'archivage des données.

---

### Table 6 — `new_document` (Document)

**Rôle :** Stocke les documents scannés attachés à un dossier (facture, bon de livraison, bon de commande, etc.). Chaque fichier scanné correspond à une ligne dans cette table.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Nom Fichier | `new_file_name` | Texte (255) | ✅ | Nom du fichier scanné (ex: facture_SARL-001.pdf) |
| Dossier | `new_folder_id` | Lookup → `new_folder` | ✅ | Dossier auquel appartient ce document |
| Type Scan | `new_scan_type` | Choix | ❌ | Facture, BL, BC, BR, Attestation Fiscale, Attestation Service, Contrat, Devis, Reçu, Autre |
| URL SharePoint | `new_sharepoint_url` | URL (500) | ❌ | Lien direct vers le fichier dans SharePoint |
| Taille (Ko) | `new_size_kb` | Nombre entier | ❌ | Taille du fichier en kilo-octets |
| Date Upload | `new_upload_date` | DateTime | ✅ | Date et heure du dépôt du document |
| Déposé Par | `new_uploaded_by_id` | Lookup → SystemUser | ✅ | Utilisateur ayant déposé le document |
| Est Actif | `new_is_active` | Oui/Non | ✅ | Suppression logique (soft delete). Défaut: Oui |
| Version | `new_version` | Nombre entier | ❌ | Numéro de version du document (v1, v2…) |

---

### Table 7 — `new_transmission` (Transmission)

**Rôle :** Trace chaque transfert physique d'un dossier entre deux acteurs du circuit. Permet de savoir qui a transmis, à qui, quand, et si la réception a été accusée. C'est également cette table qui détermine le destinataire des notifications email.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Nom Transmission | `new_transmission_name` | Texte | ✅ | Identifiant de la transmission |
| Dossier | `new_folder_id` | Lookup → `new_folder` | ✅ | Dossier concerné |
| Rôle Émetteur | `new_from_role` | Choix | ✅ | BO, Prescripteur, DCF, Trésorerie, Agence, Admin |
| Rôle Récepteur | `new_to_role` | Choix | ✅ | Même liste de valeurs |
| Collecteur | `new_collector_id` | Lookup → SystemUser | ✅ | Personne qui doit accuser réception — destinataire de la notification email |
| Émis Par | `new_sent_by_id` | Lookup → SystemUser | ✅ | Personne qui effectue la transmission |
| Date Transmission | `new_transmission_date` | DateTime | ✅ | Date et heure de la transmission |
| Date Accusé Réception | `new_acknowledgment_date` | DateTime | ❌ | Horodatée lors de l'accusé de réception |
| Accusé Par | `new_acknowledged_by_id` | Lookup → SystemUser | ❌ | Personne ayant accusé réception |
| Commentaire Émission | `new_sending_comment` | Mémo (1000) | ❌ | Observations lors de la transmission |
| Commentaire Réception | `new_receipt_comment` | Mémo (1000) | ❌ | Observations lors de la réception |
| Statut Transmission | `new_transmission_status` | Choix | ✅ | En Cours, Complété |
| Agence | `new_branch_id` | Lookup → `new_branch` | ❌ | Agence destinataire (pour transmissions vers agence) |

---

### Table 8 — `new_followup` (Relance)

**Rôle :** Enregistre chaque tentative de relance effectuée par le Bureau d'Ordre, que ce soit vers un fournisseur (document manquant) ou un prescripteur (validation en attente). Constitue un journal de communication auditables.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Nom Relance | `new_followup_name` | Texte | ✅ | Identifiant de la relance |
| Dossier | `new_folder_id` | Lookup → `new_folder` | ✅ | Dossier concerné |
| Type Relance | `new_followup_type` | Choix | ✅ | Fournisseur ou Prescripteur |
| Date Relance | `new_followup_date` | DateTime | ✅ | Date et heure de la relance |
| Envoyé Par | `new_sent_by_id` | Lookup → SystemUser | ✅ | Agent BO ayant effectué la relance |
| Destinataire | `new_recipient_id` | Lookup → SystemUser | ❌ | Utilisateur concerné (null si relance fournisseur) |
| Contenu | `new_content` | Mémo (2000) | ✅ | Corps du message de relance |
| Résultat | `new_result` | Choix | ✅ | En Attente, Répondu, Sans Suite |

> **Note :** Le canal de relance est uniquement l'email Outlook. Le champ canal a été supprimé car redondant.

---

### Table 9 — `new_block` (Blocage)

**Rôle :** Trace les blocages appliqués à un dossier. Un dossier bloqué ne peut pas avancer dans le circuit tant que le blocage n'est pas levé. L'historique complet des blocages et déblocages est conservé.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Nom Blocage | `new_block_name` | Texte | ✅ | Identifiant du blocage |
| Dossier | `new_folder_id` | Lookup → `new_folder` | ✅ | Dossier bloqué |
| Date Blocage | `new_block_date` | DateTime | ✅ | Date et heure du blocage |
| Bloqué Par | `new_blocked_by_id` | Lookup → SystemUser | ✅ | Utilisateur ayant posé le blocage |
| Motif | `new_reason` | Mémo (2000) | ✅ | Explication libre du motif de blocage |
| Est Actif | `new_is_active` | Oui/Non | ✅ | Oui = blocage actif, Non = blocage levé. Défaut: Oui |
| Date Déblocage | `new_unblock_date` | DateTime | ❌ | Horodatée lors de la levée du blocage |
| Débloqué Par | `new_unblocked_by_id` | Lookup → SystemUser | ❌ | Utilisateur ayant levé le blocage |
| Résolution | `new_resolution` | Mémo (2000) | ❌ | Description de la résolution apportée |

---

### Table 10 — `new_notification` (Notification)

**Rôle :** Stocke les notifications in-app envoyées aux utilisateurs. Complément des emails Outlook, ces notifications sont affichées directement dans l'interface Power Apps pour alerter les utilisateurs d'actions à effectuer.

| Colonne | Nom technique | Type | Obligatoire | Description |
|---|---|---|---|---|
| Nom Notification | `new_notification_name` | Texte | ✅ | Identifiant de la notification |
| Destinataire | `new_recipient_id` | Lookup → SystemUser | ✅ | Utilisateur destinataire de la notification |
| Dossier | `new_folder_id` | Lookup → `new_folder` | ❌ | Dossier concerné par la notification |
| Type | `new_notification_type` | Choix | ✅ | Info, Warning, Error, Success |
| Titre | `new_title` | Texte (200) | ✅ | Titre court de la notification |
| Message | `new_message` | Mémo (1000) | ✅ | Corps de la notification |
| Est Lue | `new_is_read` | Oui/Non | ✅ | Indique si l'utilisateur a lu la notification. Défaut: Non |
| Date Création | `new_created_date` | DateTime | ✅ | Date et heure de création |
| Date Lecture | `new_read_date` | DateTime | ❌ | Horodatée lors de la lecture |
| URL Action | `new_action_url` | URL (500) | ❌ | Lien vers la page ou le dossier concerné |
| Expire Le | `new_expires_on` | DateTime | ❌ | Date d'expiration automatique de la notification |

---

## Récapitulatif

| Phase | Table | Rôle | Dépendances |
|---|---|---|---|
| 2 | `new_company` | Référentiel sociétés | Aucune |
| 2 | `new_branch` | Référentiel agences | Aucune |
| 2 | `new_department` | Référentiel directions | `new_company` |
| 2 | `new_supplier` | Référentiel fournisseurs | `new_branch` |
| 3 | `new_folder` | Dossier principal | `new_company`, `new_branch`, `new_department`, `new_supplier` |
| 4 | `new_document` | Documents scannés | `new_folder` |
| 4 | `new_transmission` | Transmissions entre acteurs | `new_folder`, `new_branch` |
| 4 | `new_followup` | Relances fournisseurs/prescripteurs | `new_folder` |
| 4 | `new_block` | Blocages et déblocages | `new_folder` |
| 4 | `new_notification` | Notifications in-app | `new_folder` |

**Total : 10 tables custom | ~80 colonnes | Relations Referential Restrict Delete sur toutes les tables historiques**
