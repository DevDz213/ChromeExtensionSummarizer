from fpdf import FPDF

class LettreMotivation(FPDF):
    def __init__(self):
        super().__init__()
        self.add_page()
        self.set_margins(20, 20, 20)
    
    def ajouter_titre(self, poste):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, f'Candidature : {poste}', ln=True)
        self.ln(5)  # Espace vertical
    
    def ajouter_formule_politesse(self):
        self.set_font('Arial', '', 11)
        self.cell(0, 7, 'Madame, Monsieur,', ln=True)
        self.ln(3)
    
    def ajouter_corps_texte(self, texte):
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 7, texte)
        self.ln(5)
    
    def ajouter_signature(self, nom):
        self.set_font('Arial', '', 11)
        self.cell(0, 7, 'Cordialement,', ln=True)
        self.ln(2)
        self.set_font('Arial', 'B', 11)
        self.cell(0, 7, nom, ln=True)

# Utilisation
pdf = LettreMotivation()
pdf.ajouter_titre('Développeur Python')
pdf.ajouter_formule_politesse()

corps = """Je me permets de vous adresser ma candidature pour le poste de Développeur Python.

Fort de mes compétences en développement et de ma passion pour la technologie, je serais ravi de contribuer à vos projets."""

pdf.ajouter_corps_texte(corps)
pdf.ajouter_signature('Arezki Oussad')

pdf.output('lettre_motivation.pdf')