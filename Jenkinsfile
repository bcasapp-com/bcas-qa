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
    ALLURE_PROJECT    = 'qa-bcass'
  }

  stages {
    stage('Instalar') {
      steps {
        sh 'npm ci'
        sh 'if [ "$BROWSER" = "all" ]; then npx playwright install; else npx playwright install "$BROWSER"; fi'
      }
    }
    stage('Tests') {
      steps {
        sh '''
          rm -rf allure-results
          ARGS=""
          [ "$BROWSER" != "all" ] && ARGS="$ARGS --project=$BROWSER"
          [ -n "$GREP" ] && ARGS="$ARGS --grep=$GREP"
          npx playwright test $ARGS
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