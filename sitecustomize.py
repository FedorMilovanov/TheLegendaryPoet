import os
import runpy
import subprocess
from pathlib import Path

if (
    os.environ.get('GITHUB_ACTIONS') == 'true'
    and os.environ.get('GITHUB_JOB') == 'materialize_mayakovsky_wave'
    and Path('tmp/maya-wave/READY').exists()
):
    runpy.run_path('tmp/maya-wave/apply_content_wave.py', run_name='__main__')
    subprocess.run(
        [
            'git',
            'add',
            'src/data/essays/mayakovskyVisualWave.ts',
            'src/data/essays/index.ts',
            'src/components/essay/EssayBlocks.tsx',
            'scripts/validate-essays.ts',
            'public/images/PROVENANCE.yml',
            'docs/research/MAYAKOVSKY_VISUAL_WAVE_2026-08-03.md',
        ],
        check=True,
    )
    subprocess.run(['git', 'rm', 'sitecustomize.py'], check=True)
