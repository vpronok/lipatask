import { Head, Link } from '@inertiajs/react';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy" />
            <div className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold">Privacy Policy</h1>
                            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                                Back to Home
                            </Link>
                        </div>
                        
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-sm text-gray-500 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
                            
                            <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
                            <p className="mb-4">
                                Welcome to Chatwazungu. We respect your privacy and are committed to protecting your personal data. 
                                This privacy policy will inform you as to how we look after your personal data when you visit our website 
                                and tell you about your privacy rights and how the law protects you.
                            </p>

                            <h2 className="text-xl font-semibold mt-6 mb-3">2. Information We Collect</h2>
                            <p className="mb-4">
                                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                                <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                                <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, and other technology on the devices you use to access this website.</li>
                                <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6 mb-3">3. How We Use Your Data</h2>
                            <p className="mb-4">
                                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                                <li>Where we need to comply with a legal obligation.</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Security</h2>
                            <p className="mb-4">
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. 
                                In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                            </p>

                            <h2 className="text-xl font-semibold mt-6 mb-3">5. Data Retention</h2>
                            <p className="mb-4">
                                We will only retain your personal data for as long as reasonably necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements.
                            </p>

                            <h2 className="text-xl font-semibold mt-6 mb-3">6. Your Legal Rights</h2>
                            <p className="mb-4">
                                Under certain circumstances, you have rights under data protection laws in relation to your personal data. These include the right to:
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li>Request access to your personal data.</li>
                                <li>Request correction of your personal data.</li>
                                <li>Request erasure of your personal data.</li>
                                <li>Object to processing of your personal data.</li>
                                <li>Request restriction of processing your personal data.</li>
                                <li>Request transfer of your personal data.</li>
                                <li>Right to withdraw consent.</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6 mb-3">7. Contact Details</h2>
                            <p className="mb-2">If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md inline-block">
                                <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@chatwazungu.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@chatwazungu.com</a></p>
                                <p><strong>Address:</strong> Haile Selassie Avenue, 00200 Nairobi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
