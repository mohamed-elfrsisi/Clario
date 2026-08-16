"""
Local skills taxonomy for the offline extraction engine.

This replaces the "ask an LLM to guess the skill list" approach with a
maintained, versioned list the team controls. It intentionally favors
recall (many aliases per canonical skill) since the matching layer
(app/matching.py) does its own fuzzy + alias resolution on top of this.

Add new skills/aliases here as the taxonomy grows — no model retraining
or API changes required.
"""

# canonical_skill -> [aliases...]  (canonical name is also matched)
SKILLS_TAXONOMY: dict[str, list[str]] = {
    "python": ["py"],
    "java": [],
    "javascript": ["js", "ecmascript"],
    "typescript": ["ts"],
    "c++": ["cpp"],
    "c#": ["csharp", "c sharp"],
    "go": ["golang"],
    "rust": [],
    "r": [],
    "sql": [],
    "postgresql": ["postgres"],
    "mysql": [],
    "mongodb": ["mongo"],
    "sqlite": [],
    "react": ["react.js", "reactjs"],
    "vue": ["vue.js", "vuejs"],
    "angular": ["angular.js", "angularjs"],
    "node.js": ["node", "nodejs"],
    "express.js": ["express"],
    "django": [],
    "flask": [],
    "fastapi": ["fast api"],
    "spring boot": ["spring"],
    "html": ["html5"],
    "css": ["css3"],
    "tailwind css": ["tailwind", "tailwindcss"],
    "rest apis": ["rest api", "restful api", "restful apis", "rest"],
    "graphql": [],
    "docker": [],
    "kubernetes": ["k8s"],
    "aws": ["amazon web services"],
    "azure": ["microsoft azure"],
    "gcp": ["google cloud platform", "google cloud"],
    "git": [],
    "github": [],
    "gitlab": [],
    "ci/cd": ["cicd", "continuous integration"],
    "linux": [],
    "bash": ["shell scripting", "shell"],
    "machine learning": ["ml"],
    "deep learning": ["dl"],
    "natural language processing": ["nlp"],
    "computer vision": ["cv"],
    "data analysis": [],
    "data visualization": [],
    "pandas": [],
    "numpy": [],
    "scikit-learn": ["sklearn", "scikit learn"],
    "tensorflow": [],
    "pytorch": [],
    "excel": ["microsoft excel", "ms excel"],
    "tableau": [],
    "power bi": ["powerbi"],
    "figma": [],
    "agile": ["scrum"],
    "project management": [],
    "communication": [],
    "leadership": [],
    "teamwork": ["collaboration"],
    "problem solving": [],
    "public speaking": [],
    "unit testing": ["testing", "test automation"],
    "ci pipelines": [],
    "microservices": [],
    "system design": [],
    "algorithms": [],
    "data structures": [],
}

# Fast lookup: any alias/canonical string (lowercased) -> canonical skill
ALIAS_TO_CANONICAL: dict[str, str] = {}
for _canonical, _aliases in SKILLS_TAXONOMY.items():
    ALIAS_TO_CANONICAL[_canonical] = _canonical
    for _alias in _aliases:
        ALIAS_TO_CANONICAL[_alias] = _canonical

ALL_SURFACE_FORMS: list[str] = sorted(ALIAS_TO_CANONICAL.keys(), key=len, reverse=True)
