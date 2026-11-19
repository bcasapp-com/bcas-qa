pipeline {
  agent { label 'playwright' }

  options {
    timestamps()
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  parameters {
    choice(name: 'BROWSER', choices: ['chromium', 'firefox', 'webkit', 'all'], description: 'Proyecto de Playwright')
    string(name: 'GREP', defaultValue: '', description: 'Filtro de tests, ej: @smoke')
  }

  environment {
    CI = 'true'
    PNPM_VERSION      = '9.0'  
    ALLURE_URL        = 'http://allure-docker-service.railway.internal:5050'
    ALLURE_PUBLIC_URL = 'https://allure-docker-service-qa.up.railway.app'
    ALLURE_PROJECT    = 'qa-e2e'
  }

  stages {
    stage('Instalar') {
      steps {
        // Temporal: instala pnpm solo si la imagen del agente aún no lo trae
        sh 'command -v pnpm || npm install -g pnpm@$PNPM_VERSION'
        sh 'node --version && pnpm --version'

        sh 'pnpm install --frozen-lockfile'
        sh 'if [ "$BROWSER" = "all" ]; then pnpm exec playwright install; else pnpm exec playwright install "$BROWSER"; fi'
      }
    }

    stage('Tests') {
      steps {
        sh '''
          rm -rf allure-results
          ARGS=""
          [ "$BROWSER" != "all" ] && ARGS="$ARGS --project=$BROWSER"
          [ -n "$GREP" ] && ARGS="$ARGS --grep=$GREP"
          pnpm exec playwright test $ARGS
        '''
      }
    }
  }

  post {
    always {
      sh 'zip -rq allure-results.zip allure-results || true'
      archiveArtifacts artifacts: 'playwright-report/**, test-results/**, allure-results.zip', allowEmptyArchive: true
      withCredentials([usernamePassword(credentialsId: 'allure-admin',
                       usernameVariable: 'ALLURE_USER', passwordVariable: 'ALLURE_PASS')]) {
        sh 'bash ci/send-allure.sh'
      }
    }
  }
}