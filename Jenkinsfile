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
    ALLURE_URL        = 'http://allure-docker-service.railway.internal:5050'
    ALLURE_PUBLIC_URL = 'https://allure-docker-service-qa.up.railway.app'
    ALLURE_PROJECT    = 'qa-e2e'
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
        // Credenciales de los usuarios de prueba (en local salen de .env, que no se versiona)
        withCredentials([
          usernamePassword(credentialsId: 'e2e-test-user',
                           usernameVariable: 'E2E_TEST_USER_EMAIL', passwordVariable: 'E2E_TEST_USER_PASSWORD'),
          usernamePassword(credentialsId: 'e2e-test-student',
                           usernameVariable: 'E2E_TEST_STUDENT_EMAIL', passwordVariable: 'E2E_TEST_STUDENT_PASSWORD'),
          usernamePassword(credentialsId: 'e2e-test-agent',
                           usernameVariable: 'E2E_TEST_AGENT_EMAIL', passwordVariable: 'E2E_TEST_AGENT_PASSWORD')
        ]) {
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