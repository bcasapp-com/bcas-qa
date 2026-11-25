pipeline {
  agent { label 'playwright' }

  options {
    timestamps()
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  // Ejecución diaria a las 8:00 hora de Madrid, con los valores por defecto de los parámetros
  triggers {
    cron('''TZ=Europe/Madrid
42 14 * * *''')
  }

  parameters {
    choice(name: 'BROWSER', choices: ['chromium', 'firefox', 'webkit', 'all'], description: 'Proyecto de Playwright')
    string(name: 'GREP', defaultValue: '', description: 'Filtro de tests, ej: @smoke')
  }

  environment {
    CI = 'true'
    ALLURE_URL        = 'http://allure-docker-service.railway.internal:8080'
    ALLURE_PUBLIC_URL = 'https://allure-docker-service-qa.up.railway.app'
    ALLURE_PROJECT    = 'bcas-qa'
  }

  stages {
    stage('Instalar') {
      steps {
        sh '''
          PNPM_VERSION=$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]")
          if [ "$(pnpm --version 2>/dev/null)" != "$PNPM_VERSION" ]; then
            npm install -g "pnpm@$PNPM_VERSION"
          fi
        '''
        sh 'node --version && pnpm --version'

        sh 'pnpm install --frozen-lockfile'
        sh 'if [ "$BROWSER" = "all" ]; then pnpm exec playwright install; else pnpm exec playwright install "$BROWSER"; fi'
      }
    }

    stage('Tests') {
      steps {
        withCredentials([file(credentialsId: 'e2e-env', variable: 'ENV_FILE')]) {
          sh '''
            cp "$ENV_FILE" .env
            rm -rf allure-results
            ARGS=""
            [ "$BROWSER" != "all" ] && ARGS="$ARGS --project=$BROWSER"
            [ -n "$GREP" ] && ARGS="$ARGS --grep=$GREP"
            pnpm exec playwright test $ARGS
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'rm -f .env'
      sh 'zip -rq allure-results.zip allure-results || true'
      archiveArtifacts artifacts: 'playwright-report/**, test-results/**, allure-results.zip', allowEmptyArchive: true
      withCredentials([usernamePassword(credentialsId: 'allure-admin',
                       usernameVariable: 'ALLURE_USER', passwordVariable: 'ALLURE_PASS')]) {
        sh 'bash ci/send-allure.sh'
      }
    }
  }
}