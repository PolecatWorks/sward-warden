{{/*
Expand the name of the chart.
*/}}
{{- define "sward-warden.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "sward-warden.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "sward-warden.be.config" -}}
{{- $baseconfig := fromYaml (.Files.Get "configs/config.yaml") }}
{{- $newconfig := default dict .Values.be.config }}
{{- $postmerge := mergeOverwrite $baseconfig $newconfig }}
{{- tpl (toYaml $postmerge) . }}
{{- end -}}



{{- define "sward-warden.be.volumes" -}}
{{- tpl (toYaml .Values.be.volumes) . }}
{{- end -}}

{{- define "sward-warden.be.volumeMounts" -}}
{{- tpl (toYaml .Values.be.volumeMounts) . }}
{{- end -}}

{{- define "sward-warden.be.env" -}}
{{- tpl (toYaml .Values.be.env) . }}
{{- end -}}

{{- define "sward-warden.be.initContainer.env" -}}
{{- tpl (toYaml .Values.be.initContainer.env) . }}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "sward-warden.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Selector labels for be
*/}}
{{- define "sward-warden.be.selectorLabels" -}}
app.kubernetes.io/name: be
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels for fe
*/}}
{{- define "sward-warden.fe.selectorLabels" -}}
app.kubernetes.io/name: fe
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels for be
*/}}
{{- define "sward-warden.be.labels" -}}
helm.sh/chart: {{ include "sward-warden.chart" . }}
{{ include "sward-warden.be.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Values.be.labels }}
{{ toYaml .Values.be.labels }}
{{- end }}
{{- end }}

{{/*
Common labels for fe
*/}}
{{- define "sward-warden.fe.labels" -}}
helm.sh/chart: {{ include "sward-warden.chart" . }}
{{ include "sward-warden.fe.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Values.fe.labels }}
{{ toYaml .Values.fe.labels }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use for be
*/}}
{{- define "sward-warden.be.serviceAccountName" -}}
{{- default (printf "%s-be" (include "sward-warden.fullname" .)) .Values.be.serviceAccount.name }}
{{- end }}

{{/*
Create the name of the service account to use for fe
*/}}
{{- define "sward-warden.fe.serviceAccountName" -}}
{{- default (printf "%s-fe" (include "sward-warden.fullname" .)) .Values.fe.serviceAccount.name }}
{{- end }}
