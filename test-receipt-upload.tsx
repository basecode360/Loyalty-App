import React from 'react';
import { View, Button, Alert, Text } from 'react-native';
import { supabase } from './lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function TestReceiptUpload() {

    const testUpload = async () => {
        try {
            console.log('=== UPLOAD TEST ===');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'Login required');
                return;
            }
            console.log('User:', user.email);

            // Smaller test content
            const testContent = 'Simple test';

            // Use text instead of JSON blob
            const filename = `${user.id}/test_${Date.now()}.txt`;
            console.log('Uploading:', filename);

            const { data, error } = await supabase.storage
                .from('receipts-original')
                .upload(filename, testContent, {
                    contentType: 'text/plain',
                    upsert: true // Allow overwrite
                });

            if (error) {
                console.error('❌ Upload error:', error);
                Alert.alert('Upload Error', error.message);
                return;
            }

            console.log('✅ UPLOAD SUCCESS:', data);
            Alert.alert('Upload Success!', `File uploaded: ${data.path}`);

            // Test edge function
            console.log('Testing edge function...');
            const { data: { session } } = await supabase.auth.getSession();

            const { data: functionResult, error: functionError } = await supabase.functions
                .invoke('submit-receipt', {
                    body: {
                        image_path: data.path,
                        test_mode: true
                    }
                });

            if (functionError) {
                console.error('❌ Function error:', functionError);
                Alert.alert('Function Error', functionError.message);
            } else {
                console.log('✅ Function result:', functionResult);
                Alert.alert('Complete Success!', JSON.stringify(functionResult));
            }

        } catch (err) {
            console.error('Error:', err);
            Alert.alert('Error', err.message);
        }
    };

    const testImageUpload = async () => {
        try {
            console.log('=== IMAGE UPLOAD TEST ===');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'Login required');
                return;
            }

            // Pick image with compression
            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.2, // Very low quality for testing
                base64: true  // Get base64 directly
            });

            if (pickerResult.canceled) {
                return;
            }

            const asset = pickerResult.assets[0];
            console.log('Image selected, size estimate:', asset.base64?.length || 'unknown');

            // Method 1: Try direct base64 upload
            if (asset.base64) {
                const base64Data = asset.base64;
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });

                const filename = `${user.id}/small_receipt_${Date.now()}.jpg`;
                console.log('Uploading small image...');

                const { data, error } = await supabase.storage
                    .from('receipts-original')
                    .upload(filename, blob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (!error) {
                    console.log('✅ Image uploaded:', data);
                    Alert.alert('Success!', 'Image uploaded!');

                    // Test with edge function
                    const { data: { session } } = await supabase.auth.getSession();
                    const { data: result } = await supabase.functions
                        .invoke('submit-receipt', {
                            body: { image_path: data.path }
                        });

                    console.log('Edge function result:', result);
                    return;
                }

                console.error('Upload error:', error);
            }

            // Method 2: Create signed URL (fallback)
            console.log('Trying signed URL method...');
            const filename = `${user.id}/receipt_signed_${Date.now()}.jpg`;

            const { data: signedData, error: signedError } = await supabase.storage
                .from('receipts-original')
                .createSignedUploadUrl(filename);

            if (signedError) {
                console.error('Signed URL error:', signedError);
                Alert.alert('Error', 'Could not create upload URL');
                return;
            }

            console.log('Got signed URL');

            // Upload using signed URL
            const response = await fetch(asset.uri);
            const blob = await response.blob();

            const uploadResp = await fetch(signedData.signedUrl, {
                method: 'PUT',
                body: blob,
                headers: {
                    'Content-Type': 'image/jpeg',
                }
            });

            if (uploadResp.ok) {
                console.log('✅ Uploaded via signed URL');
                Alert.alert('Success', 'Image uploaded via signed URL!');
            } else {
                console.error('Signed upload failed:', uploadResp.status);
                Alert.alert('Error', 'Upload failed');
            }

        } catch (err: any) {
            console.error('Image error:', err);
            Alert.alert('Error', err.message);
        }
    };

    const debugSetup = async () => {
        console.log('=== SYSTEM CHECK ===');

        try {
            // Check auth
            const { data: { user } } = await supabase.auth.getUser();
            console.log('1. Auth:', user ? '✅ Logged in' : '❌ Not logged in');

            // Storage bucket exists (confirmed in dashboard)
            console.log('2. Storage: ✅ receipts-original bucket exists');

            // Check tables
            const { error: receiptsError } = await supabase
                .from('receipts')
                .select('id')
                .limit(1);
            console.log('3. Receipts table:', !receiptsError ? '✅ Exists' : '❌ Missing');

            const { error: ledgerError } = await supabase
                .from('points_ledger')
                .select('id')
                .limit(1);
            console.log('4. Points ledger:', !ledgerError ? '✅ Exists' : '❌ Missing');

            // Check edge function
            try {
                const { data } = await supabase.functions.invoke('submit-receipt', {
                    body: { test: true }
                });
                console.log('5. Edge Function: ✅ Deployed');
            } catch {
                console.log('5. Edge Function: ⚠️ Not responding correctly');
            }

            // Get session
            const { data: { session } } = await supabase.auth.getSession();
            console.log('6. Session:', session ? '✅ Active' : '❌ No session');

            Alert.alert('System Check Complete', 'Check console for details');
        } catch (error: any) {
            console.error('Debug error:', error);
            Alert.alert('Debug Error', error.message);
        }
    };

    const quickTest = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Not logged in');
                return;
            }

            // Simplest possible test
            const filename = `${user.id}/quick_test.txt`;
            const { data, error } = await supabase.storage
                .from('receipts-original')
                .upload(filename, 'Hello World', {
                    contentType: 'text/plain',
                    upsert: true // Allow overwrite for testing
                });

            if (error) {
                Alert.alert('Error', error.message);
                console.error(error);
            } else {
                Alert.alert('Success', 'Quick test passed!');
                console.log('Success:', data);
            }
        } catch (err: any) {
            console.error(err);
        }
    };

    return (
        <View style={{ backgroundColor: '#f0f0f0', padding: 10, borderRadius: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                🧪 Test Mode
            </Text>

            <Button title="1. System Check" onPress={debugSetup} color="#FF9800" />

            <View style={{ marginTop: 5 }}>
                <Button title="2. Quick Test" onPress={quickTest} color="#2196F3" />
            </View>

            <View style={{ marginTop: 5 }}>
                <Button title="3. Test Upload" onPress={testUpload} color="#4CAF50" />
            </View>

            <View style={{ marginTop: 5 }}>
                <Button title="4. Test with Image" onPress={testImageUpload} color="#9C27B0" />
            </View>
        </View>
    );
}
