project = 'OpenMBEE View Editor'
author = project+' Project Team'
copyright = '2019, '+author
version = '5.0'
release = '5.0.0'
try:
    import sphinx_bootstrap_theme
    html_theme_path = sphinx_bootstrap_theme.get_html_theme_path()
    html_theme = 'bootstrap'
except:
    pass
#these are enforced by rstdoc, but keep them for sphinx-build
numfig = 0
smartquotes = 0
source_suffix = '.rst'
templates_path = []
language = None
highlight_language = "none"
default_role = 'math'
pygments_style = 'sphinx'
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
master_doc = 'index'
html_extra_path=['doc/_traceability_file.svg'] #relative to
