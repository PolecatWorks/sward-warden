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
{{- $newconfig := default dict .Values.be.configs }}
{{- $postmerge := mergeOverwrite $baseconfig $newconfig }}
{{- toYaml $postmerge }}
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
