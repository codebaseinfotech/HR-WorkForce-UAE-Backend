<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $inputType = $this->input('type', $this->input('message_type', 'text'));
        $normalized = $inputType === 'media' ? 'image' : $inputType;

        $this->merge([
            'type' => $normalized ?: 'text',
        ]);
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:text,image,file'],
            'body' => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'max:20480'],
            'file' => ['nullable', 'file', 'max:20480'],
            'files' => ['nullable', 'array', 'max:1'],
            'files.*' => ['file', 'max:20480'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = $this->input('type', 'text');

            if ($type === 'text' && blank($this->input('body'))) {
                $validator->errors()->add('body', 'Body is required for text messages.');
            }

            if (in_array($type, ['image', 'file'], true) && ! $this->hasAnyAttachment()) {
                $validator->errors()->add('attachment', 'Attachment is required for image/file messages.');
            }
        });
    }

    public function attachmentFile()
    {
        if ($this->hasFile('attachment')) {
            return $this->file('attachment');
        }

        if ($this->hasFile('file')) {
            return $this->file('file');
        }

        if ($this->hasFile('files')) {
            $files = $this->file('files');

            return is_array($files) ? ($files[0] ?? null) : $files;
        }

        return null;
    }

    private function hasAnyAttachment(): bool
    {
        return $this->hasFile('attachment') || $this->hasFile('file') || $this->hasFile('files');
    }
}
